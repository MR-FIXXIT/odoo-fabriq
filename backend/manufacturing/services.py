from decimal import Decimal
from typing import Dict, List, Tuple

from .models import BillOfMaterials, BOMItem

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
        # keep as string to preserve precision in JSON responses
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
