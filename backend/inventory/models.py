from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone


class Product(models.Model):
    id = models.BigAutoField(primary_key=True)
    sku = models.CharField(
        max_length=100, unique=True, db_index=True, help_text="Stock Keeping Unit"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    product_type = models.CharField(
        max_length=10,
        choices=(
            ("RAW", "Raw Material"),
            ("FINISHED", "Finished Good"),
        ),
        default="RAW",
    )
    stock_quantity = models.DecimalField(
        max_digits=18, decimal_places=4, default=Decimal("0.00")
    )
    unit_of_measure = models.CharField(
        max_length=50, help_text="e.g., units, kg, meters"
    )
    reorder_level = models.DecimalField(
        max_digits=18, decimal_places=4, default=Decimal("0.00")
    )
    default_warehouse = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="products_created",
    )

    class Meta:
        ordering = ("sku",)
        indexes = [models.Index(fields=["sku", "name"])]

    def __str__(self):
        return f"{self.sku} - {self.name}"


class StockLedgerEntry(models.Model):
    """
    Simple immutable-ish ledger for stock changes.
    Kept compact here; richer InventoryTransaction (with metadata, ref_type, immutability enforcement)
    can replace/augment this later per the full spec.
    """

    class TransactionType(models.TextChoices):
        INITIAL_STOCK = "INIT", "Initial Stock"
        STOCK_IN = "IN", "Stock In (Production)"
        STOCK_OUT = "OUT", "Stock Out (Consumption)"
        ADJUSTMENT = "ADJ", "Manual Adjustment"

    id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(
        "Product", on_delete=models.PROTECT, related_name="stock_entries"
    )
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    quantity_changed = models.DecimalField(max_digits=18, decimal_places=4)
    new_stock_quantity = models.DecimalField(max_digits=18, decimal_places=4)
    notes = models.TextField(blank=True, help_text="e.g., MO-101 Consumption")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["product", "transaction_type", "created_at"]),
        ]

    def __str__(self):
        return f"{self.product.name}: {self.quantity_changed} on {self.created_at.strftime('%Y-%m-%d')}"


class StockBalance(models.Model):
    id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="stock_balances"
    )
    warehouse = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Warehouse code/name (simple for now)",
    )
    qty_on_hand = models.DecimalField(
        max_digits=18, decimal_places=4, default=Decimal("0.00")
    )
    reserved_qty = models.DecimalField(
        max_digits=18, decimal_places=4, default=Decimal("0.00")
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("product", "warehouse")
        indexes = [models.Index(fields=["product", "warehouse"])]

    def available_qty(self):
        return (self.qty_on_hand or Decimal("0")) - (self.reserved_qty or Decimal("0"))

    def __str__(self):
        wh = self.warehouse or "global"
        return f"{self.product.sku} @ {wh}: on_hand={self.qty_on_hand} reserved={self.reserved_qty}"
