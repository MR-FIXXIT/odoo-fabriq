from django.db import models
from django.utils import timezone
from django.conf import settings
from inventory.models import Product


# WorkCenter Model
class WorkCenter(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    capacity = models.PositiveIntegerField(help_text="Concurrent operators capacity")
    cost_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    location = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(blank=True, null=True, help_text="Optional metadata tags")

    def __str__(self):
        return self.name


# Bill of Materials (BOM) Models
class BillOfMaterials(models.Model):
    name = models.CharField(max_length=255)
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name="bom",
        limit_choices_to={"product_type": "FINISHED"},
    )
    version = models.CharField(max_length=50, default="1.0")
    effective_from = models.DateField()
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"BOM for {self.product.name}"


class BOMItem(models.Model):
    bom = models.ForeignKey(
        BillOfMaterials, on_delete=models.CASCADE, related_name="items"
    )
    component = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        limit_choices_to={"product_type": "RAW"},
    )
    qty_per_unit = models.DecimalField(max_digits=10, decimal_places=4)
    scrap_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00, help_text="Scrap percentage"
    )

    def __str__(self):
        return f"{self.qty_per_unit} of {self.component.name}"


class BOMOperation(models.Model):
    bom = models.ForeignKey(
        BillOfMaterials, on_delete=models.CASCADE, related_name="operations"
    )
    work_center = models.ForeignKey(WorkCenter, on_delete=models.PROTECT)
    name = models.CharField(max_length=100, help_text="e.g., Assembly, Painting")
    sequence = models.PositiveIntegerField(help_text="Order of the step in the process")

    class Meta:
        ordering = ["sequence"]

    def __str__(self):
        return f"Step {self.sequence}: {self.name} at {self.work_center.name}"


# Manufacturing Order (MO) Model
class ManufacturingOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PLANNED = "PLANNED", "Planned"
        RELEASED = "RELEASED", "Released"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        DONE = "DONE", "Done"
        CANCELLED = "CANCELLED", "Cancelled"
        AWAITING_MATERIALS = "AWAITING_MATERIALS", "Awaiting Materials"

    id = models.BigAutoField(primary_key=True)
    mo_number = models.CharField(max_length=32, unique=True, blank=True, null=True)
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.PROTECT,
        related_name="manufacturing_orders",
    )
    qty = models.DecimalField(max_digits=18, decimal_places=4)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.DRAFT
    )
    linked_bom = models.ForeignKey(
        "manufacturing.BillOfMaterials",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mos",
    )
    # snapshot: list of {component_id, required_qty}
    materials_snapshot = models.JSONField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )

    def __str__(self):
        return self.mo_number or f"MO-{self.pk}"


# Work Order (WO) Model
class WorkOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ASSIGNED = "ASSIGNED", "Assigned"
        STARTED = "STARTED", "Started"
        PAUSED = "PAUSED", "Paused"
        BLOCKED = "BLOCKED", "Blocked"
        COMPLETED = "COMPLETED", "Completed"

    mo = models.ForeignKey(
        ManufacturingOrder, on_delete=models.CASCADE, related_name="work_orders"
    )
    operation_no = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    work_center = models.ForeignKey(WorkCenter, on_delete=models.PROTECT)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    est_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    actual_hours = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["operation_no"]

    def __str__(self):
        return f"WO for {self.mo.mo_number} - Step {self.operation_no}: {self.title}"
