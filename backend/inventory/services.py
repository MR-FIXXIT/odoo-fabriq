from decimal import Decimal
from django.db.models import F, Sum
from .models import StockBalance


def aggregate_available_for_products(product_ids):
    balances = (
        StockBalance.objects.filter(product_id__in=product_ids)
        .annotate(available=F("qty_on_hand") - F("reserved_qty"))
        .values("product_id")
        .annotate(total_available=Sum("available"))
    )
    return {b["product_id"]: (b["total_available"] or Decimal("0")) for b in balances}
