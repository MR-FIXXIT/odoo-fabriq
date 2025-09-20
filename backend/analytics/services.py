from datetime import date, timedelta
from decimal import Decimal

from django.db.models import (
    Count,
    Sum,
    Max,
    F,
    Q,
    ExpressionWrapper,
    DurationField,
    DateField,
)
from django.db.models.functions import Cast, TruncWeek, TruncMonth
from django.utils import timezone

from manufacturing.models import ManufacturingOrder, WorkOrder
from inventory.models import Product, StockBalance


def _completed_mos_qs(start_date, end_date):
    """
    Return queryset of MOs considered completed in the interval.
    We consider an MO completed if:
      - status == DONE
      OR
      - all its work_orders are COMPLETED (we detect by comparing counts)
    We annotate completed_at as Max(work_orders.completed_at).
    """
    mos = (
        ManufacturingOrder.objects.annotate(
            total_ops=Count("work_orders"),
            completed_ops=Count(
                "work_orders", filter=Q(work_orders__status=WorkOrder.Status.COMPLETED)
            ),
            completed_at=Max("work_orders__completed_at"),
        ).filter(
            Q(status=ManufacturingOrder.Status.DONE)
            | Q(total_ops__gt=0, total_ops=F("completed_ops"))
        )
        # completed_at may be null for some MOs that are marked DONE without WOs; prefer completed_at annotation
    )

    # restrict by completed_at between start_date and end_date (inclusive)
    mos = mos.filter(
        completed_at__date__gte=start_date, completed_at__date__lte=end_date
    )
    return mos


def compute_overview(days: int = 30):
    """
    Compute dashboard metrics for the last `days` days (including today).
    Returns a dict ready for JSON response.
    """
    end_dt = timezone.now().date()
    start_dt = end_dt - timedelta(days=days - 1)

    result = {"start_date": str(start_dt), "end_date": str(end_dt)}

    completed_qs = _completed_mos_qs(start_dt, end_dt)

    # Orders Completed and Units Produced
    mos_completed = completed_qs.count()
    units_produced_agg = completed_qs.aggregate(total_units=Sum("qty"))
    units_produced = Decimal(units_produced_agg["total_units"] or 0)

    result["mos_completed"] = mos_completed
    result["units_produced"] = str(units_produced)

    # Avg lead time hours (avg of completed_at - created_at)
    # compute per-MO duration in seconds, then average -> hours
    durations = completed_qs.annotate(
        lead_time=ExpressionWrapper(
            (
                Cast(F("completed_at"), output_field=DateField())
                - Cast(F("created_at"), output_field=DateField())
            ),
            output_field=DurationField(),
        )
    )
    # fallback: compute using timestamps where available using seconds
    # safer compute using completed_at and created_at datetimes
    durations = completed_qs.annotate(
        lead_seconds=ExpressionWrapper(
            F("completed_at") - F("created_at"), output_field=DurationField()
        )
    ).exclude(lead_seconds__isnull=True)

    # Sum seconds and count
    total_seconds = 0
    count_for_lead = 0
    for row in durations.values_list("lead_seconds", flat=True):
        if row is None:
            continue
        # Django returns timedelta
        total_seconds += row.total_seconds()
        count_for_lead += 1

    avg_lead_hours = (
        (total_seconds / 3600.0 / count_for_lead) if count_for_lead else 0.0
    )
    result["avg_lead_time_hours"] = round(avg_lead_hours, 2)

    # On-time completion rate
    # Only consider MOs that have a due_date set
    mos_with_due = completed_qs.filter(due_date__isnull=False)
    due_total = mos_with_due.count()
    on_time_total = mos_with_due.filter(completed_at__date__lte=F("due_date")).count()
    on_time_rate = (on_time_total / due_total) if due_total else 0.0
    result["on_time_completion_rate"] = round(on_time_rate, 4)

    # Production Volume Over Time (group by week)
    weekly = (
        completed_qs.annotate(week=TruncWeek("completed_at"))
        .values("week")
        .annotate(units=Sum("qty"))
        .order_by("week")
    )
    result["production_volume_by_week"] = [
        {
            "week_start": w["week"].date().isoformat() if w["week"] else None,
            "units": str(w["units"] or 0),
        }
        for w in weekly
    ]

    # Order status breakdown (counts of current orders by status)
    status_counts = (
        ManufacturingOrder.objects.values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )
    result["order_status_breakdown"] = {s["status"]: s["count"] for s in status_counts}

    # Top 5 Most Produced Products (by units produced in period)
    top_products = (
        completed_qs.values("product__id", "product__sku", "product__name")
        .annotate(total_units=Sum("qty"))
        .order_by("-total_units")[:5]
    )
    result["top_products"] = [
        {
            "product_id": p["product__id"],
            "sku": p["product__sku"],
            "name": p["product__name"],
            "units": str(p["total_units"] or 0),
        }
        for p in top_products
    ]

    # Active Orders with Delays: In-progress orders past due date
    today = timezone.now().date()
    delayed_qs = ManufacturingOrder.objects.filter(
        status__in=[
            ManufacturingOrder.Status.IN_PROGRESS,
            ManufacturingOrder.Status.RELEASED,
        ],
        due_date__isnull=False,
        due_date__lt=today,
    ).order_by("due_date")
    result["delayed_orders"] = [
        {
            "id": mo.pk,
            "mo_number": mo.mo_number,
            "product_id": mo.product_id,
            "qty": str(mo.qty),
            "due_date": mo.due_date.isoformat(),
            "status": mo.status,
        }
        for mo in delayed_qs[:50]
    ]

    # Inventory Levels: top 5 raw materials and top 5 finished goods by available qty
    # compute total available per product using StockBalance
    raw_products = (
        Product.objects.filter(product_type="RAW")
        .annotate(
            total_available=Sum("stock_balances__qty_on_hand")
            - Sum("stock_balances__reserved_qty")
        )
        .order_by("-total_available")[:5]
    )
    finished_products = (
        Product.objects.filter(product_type="FINISHED")
        .annotate(
            total_available=Sum("stock_balances__qty_on_hand")
            - Sum("stock_balances__reserved_qty")
        )
        .order_by("-total_available")[:5]
    )

    def _serialize_prod(qs):
        out = []
        for p in qs:
            qty = (
                p.total_available
                if getattr(p, "total_available", None) is not None
                else 0
            )
            out.append(
                {
                    "product_id": p.id,
                    "sku": p.sku,
                    "name": p.name,
                    "available_qty": str(qty or 0),
                }
            )
        return out

    result["top_raw_materials_by_qty"] = _serialize_prod(raw_products)
    result["top_finished_products_by_qty"] = _serialize_prod(finished_products)

    return result
