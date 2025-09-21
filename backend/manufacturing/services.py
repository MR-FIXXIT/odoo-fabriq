from decimal import Decimal
from typing import Dict, List, Tuple

from django.db import transaction
from django.utils import timezone

from .models import BillOfMaterials, BOMItem, WorkOrder

# use inventory service helper to aggregate availability (avoids direct model query here)
from inventory.services import aggregate_available_for_products


def compute_materials_snapshot(bom: BillOfMaterials, qty: Decimal) -> List[Dict]:
    """
    Return snapshot list: [{component_id, required_qty}, ...]
    required_qty = qty * bomitem.qty_per_unit (consider scrap_pct)
    """
    snapshot: List[Dict] = []
    bom_items = BOMItem.objects.filter(bom=bom)
    for item in bom_items:
        per_unit = Decimal(item.qty_per_unit)
        scrap_pct = Decimal(getattr(item, "scrap_pct", 0) or 0)
        required = (per_unit * Decimal(qty)) * (
            Decimal("1.0") + scrap_pct / Decimal("100")
        )
        snapshot.append(
            {
                "component_id": item.component_id,
                "required_qty": str(required.quantize(Decimal("0.0001"))),
            }
        )
    return snapshot


def check_snapshot_availability(snapshot: List[Dict]) -> Tuple[bool, Dict]:
    """
    Check available across all warehouses for each component in snapshot.
    Returns (all_available_bool, details) where details is mapping:
    {component_id: {"required_qty": Decimal, "available_qty": Decimal}}
    """
    component_ids = [int(s["component_id"]) for s in snapshot]
    avail_map = {}
    available_by_id = (
        aggregate_available_for_products(component_ids) if component_ids else {}
    )
    all_ok = True
    for s in snapshot:
        cid = int(s["component_id"])
        req = Decimal(s["required_qty"])
        avail = available_by_id.get(cid, Decimal("0"))
        if avail < req:
            all_ok = False
        avail_map[str(cid)] = {"required_qty": str(req), "available_qty": str(avail)}
    return all_ok, avail_map


def generate_work_orders_from_mo(mo, auto_generate: bool = True) -> List[WorkOrder]:
    """
    Read BOM operations and create WorkOrder rows for the given MO.
    - Idempotent: if work orders already exist for the MO, do nothing.
    - Each WorkOrder.operation_no is taken from BOMOperation.sequence.
    - WorkOrder.title uses BOMOperation.name; est_hours from BOMOperation.est_hours.
    Returns list of created WorkOrder instances.
    """
    if not auto_generate:
        return []

    if not mo.linked_bom:
        return []

    # don't generate if already generated
    if mo.work_orders.exists():
        return list(mo.work_orders.all())

    created_wos = []
    ops = mo.linked_bom.operations.all().order_by("sequence")
    with transaction.atomic():
        for op in ops:
            wo = WorkOrder.objects.create(
                mo=mo,
                operation_no=op.sequence,
                title=op.name,
                work_center=op.work_center,
                est_hours=op.est_hours,
                status=WorkOrder.Status.PENDING,
            )
            created_wos.append(wo)
    return created_wos


def complete_work_order(wo: WorkOrder, completed_by):
    """
    High-level complete workflow for a single WorkOrder.
    - Marks WO as COMPLETED, sets completed_at.
    - Delegates inventory movements to inventory.services.apply_wo_completion if present.
    Returns dict with status and any inventory result info.
    """
    # attempt to import inventory apply function; raise NotImplementedError if it's not yet implemented
    try:
        from inventory.services import apply_wo_completion
    except Exception:
        # inventory apply not yet implemented
        raise NotImplementedError(
            "Inventory completion flow not implemented. Implement inventory.services.apply_wo_completion to enable stock updates on WO completion."
        )

    # delegate to inventory service (which handles transactions, locking, ledger entries)
    return apply_wo_completion(wo.id, completed_by)
