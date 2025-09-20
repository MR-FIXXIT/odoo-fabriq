from django.db import models
from django.utils import timezone
from django.conf import settings
from inventory.models import Product


class WorkCenter(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    capacity = models.PositiveIntegerField(default=1, help_text="Concurrent operators")
    cost_per_hour = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    location = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(null=True, blank=True, help_text="List of tags or metadata")

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="workcenters_created",
    )

    def __str__(self):
        return self.name


class BillOfMaterials(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="boms")
    version = models.CharField(max_length=64, default="v1")
    effective_from = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="boms_created",
    )

    class Meta:
        unique_together = ("product", "version")

    def __str__(self):
        return f"BOM {self.product.sku} {self.version}"


class BOMItem(models.Model):
    bom = models.ForeignKey(
        BillOfMaterials, on_delete=models.CASCADE, related_name="items"
    )
    component = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="bom_components"
    )
    qty_per_unit = models.DecimalField(max_digits=18, decimal_places=6)
    scrap_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0, help_text="Scrap percent (0-100)"
    )

    class Meta:
        unique_together = ("bom", "component")

    def __str__(self):
        return f"{self.component.sku} x {self.qty_per_unit}"


class BOMOperation(models.Model):
    bom = models.ForeignKey(
        BillOfMaterials, on_delete=models.CASCADE, related_name="operations"
    )
    work_center = models.ForeignKey(WorkCenter, on_delete=models.PROTECT)
    name = models.CharField(max_length=100, help_text="e.g., Assembly, Painting")
    sequence = models.PositiveIntegerField(help_text="Order of the step in the process")
    est_hours = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Estimated hours for this operation",
    )

    class Meta:
        ordering = ["sequence"]
        unique_together = ("bom", "sequence")

    def __str__(self):
        return f"Step {self.sequence}: {self.name} @ {self.work_center.name}"


class ManufacturingOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PLANNED = "PLANNED", "Planned"
        RELEASED = "RELEASED", "Released"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        DONE = "DONE", "Done"
        CANCELLED = "CANCELLED", "Cancelled"
        AWAITING_MATERIALS = "AWAITING_MATERIALS", "Awaiting Materials"

    mo_number = models.CharField(max_length=32, unique=True, blank=True, null=True)
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="manufacturing_orders"
    )
    qty = models.DecimalField(max_digits=18, decimal_places=4)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.DRAFT
    )
    linked_bom = models.ForeignKey(
        BillOfMaterials,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mos",
    )
    materials_snapshot = models.JSONField(
        null=True, blank=True
    )  # list of {component_id, required_qty}
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )

    def __str__(self):
        return self.mo_number or f"MO-{self.pk}"


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
    work_center = models.ForeignKey(
        WorkCenter, on_delete=models.PROTECT, related_name="work_orders"
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_workorders",
    )
    est_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    actual_hours = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        ordering = ("mo", "operation_no")
        unique_together = ("mo", "operation_no")

    def __str__(self):
        return f"WO {self.mo.mo_number or self.mo.pk} - Op {self.operation_no}: {self.title}"
