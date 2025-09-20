from decimal import Decimal
from django.db.models import F, Sum
from typing import Dict, List, Tuple

from .models import BillOfMaterials, BOMItem

# Ensure inventory has StockBalance; if not, use Product.stock_quantity or add StockBalance (see next patch)
from inventory.models import StockBalance
from django.core.exceptions import ObjectDoesNotExist


def compute_materials_snapshot(bom: BillOfMaterials, qty: Decimal) -> List[Dict]:
    """
    Return snapshot list: [{component_id, required_qty}, ...]
    required_qty = qty * bomitem.qty_per_unit (consider scrap_pct)
    """
    snapshot = []
    bom_items = bom.items.all()  # or BOMItem.objects.filter(bom=bom)
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
    # aggregate available = sum(qty_on_hand - reserved_qty)
    balances = (
        StockBalance.objects.filter(product_id__in=component_ids)
        .annotate(available=F("qty_on_hand") - F("reserved_qty"))
        .values("product_id")
        .annotate(total_available=Sum("available"))
    )
    available_by_id = {
        b["product_id"]: (b["total_available"] or Decimal("0")) for b in balances
    }

    all_ok = True
    for s in snapshot:
        cid = int(s["component_id"])
        req = Decimal(s["required_qty"])
        avail = available_by_id.get(cid, Decimal("0"))
        if avail < req:
            all_ok = False
        avail_map[cid] = {"required_qty": req, "available_qty": avail}
    return all_ok, avail_map
