from rest_framework import serializers
from decimal import Decimal
from .models import (
    ManufacturingOrder,
    BillOfMaterials,
    BOMItem,
    BOMOperation,
    WorkCenter,
    WorkOrder,
)
from . import services as m_services
from inventory.serializers import (
    ProductSerializer,
)  # reuse product serializer for nested BOM product display

# ensure safe empty querysets to avoid DRF assertion at import time
from django.contrib.auth import get_user_model
from inventory.models import Product as _Product

_User = get_user_model()


class WorkCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkCenter
        fields = (
            "id",
            "name",
            "description",
            "capacity",
            "cost_per_hour",
            "location",
            "tags",
        )


class BOMItemSerializer(serializers.ModelSerializer):
    # provide an empty queryset initially to satisfy DRF; set real queryset in __init__
    component = serializers.PrimaryKeyRelatedField(queryset=_Product.objects.none())

    class Meta:
        model = BOMItem
        fields = ("id", "component", "qty_per_unit", "scrap_pct")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # lazy queryset for Product (avoid circular import issues)
        from inventory.models import Product

        self.fields["component"].queryset = Product.objects.all()


class BOMOperationSerializer(serializers.ModelSerializer):
    work_center = WorkCenterSerializer(read_only=True)
    # supply a safe empty queryset; __init__ will replace with real queryset
    work_center_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=WorkCenter.objects.none(),
        source="work_center",
        required=True,
    )

    class Meta:
        model = BOMOperation
        fields = (
            "id",
            "name",
            "sequence",
            "est_hours",
            "work_center",
            "work_center_id",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from .models import WorkCenter as _WC  # local

        self.fields["work_center_id"].queryset = _WC.objects.all()


class BOMSerializer(serializers.ModelSerializer):
    # safe empty queryset for product; set real queryset in __init__
    product = serializers.PrimaryKeyRelatedField(queryset=_Product.objects.none())
    items = BOMItemSerializer(many=True, required=False)
    operations = BOMOperationSerializer(many=True, required=False)

    class Meta:
        model = BillOfMaterials
        fields = (
            "id",
            "product",
            "version",
            "effective_from",
            "notes",
            "items",
            "operations",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from inventory.models import Product

        # restrict product choices to finished goods (adjust as needed)
        self.fields["product"].queryset = Product.objects.filter(
            product_type__in=["FINISHED", "FINISHED"]
        )

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        ops_data = validated_data.pop("operations", [])
        bom = BillOfMaterials.objects.create(**validated_data)
        for item in items_data:
            BOMItem.objects.create(bom=bom, **item)
        for op in ops_data:
            BOMOperation.objects.create(bom=bom, **op)
        return bom

    def update(self, instance, validated_data):
        # simple approach: update BOM fields, replace items & operations if supplied
        items_data = validated_data.pop("items", None)
        ops_data = validated_data.pop("operations", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                BOMItem.objects.create(bom=instance, **item)
        if ops_data is not None:
            instance.operations.all().delete()
            for op in ops_data:
                BOMOperation.objects.create(bom=instance, **op)
        return instance


class WorkOrderSerializer(serializers.ModelSerializer):
    work_center = WorkCenterSerializer(read_only=True)
    # give assigned_to an empty queryset initially to avoid assertion; set in __init__
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=_User.objects.none(), allow_null=True
    )

    class Meta:
        model = WorkOrder
        fields = (
            "id",
            "mo",
            "operation_no",
            "title",
            "work_center",
            "assigned_to",
            "est_hours",
            "actual_hours",
            "status",
            "started_at",
            "completed_at",
            "notes",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        User = get_user_model()
        self.fields["assigned_to"].queryset = User.objects.all()


class ManufacturingOrderDetailSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    linked_bom = BOMSerializer(read_only=True)
    work_orders = WorkOrderSerializer(many=True, read_only=True, source="work_orders")

    class Meta:
        model = ManufacturingOrder
        fields = (
            "id",
            "mo_number",
            "product",
            "qty",
            "due_date",
            "status",
            "linked_bom",
            "materials_snapshot",
            "work_orders",
            "notes",
            "created_at",
            "updated_at",
            "created_by",
        )


class ManufacturingOrderCreateSerializer(serializers.ModelSerializer):
    proceed_when_short = serializers.BooleanField(
        write_only=True,
        default=False,
        help_text="If true, create MO even if materials short (status=AWAITING_MATERIALS).",
    )

    class Meta:
        model = ManufacturingOrder
        fields = (
            "id",
            "product",
            "qty",
            "due_date",
            "linked_bom",
            "notes",
            "proceed_when_short",
            "materials_snapshot",
            "status",
            "mo_number",
        )
        read_only_fields = ("materials_snapshot", "status", "mo_number")

    def validate(self, data):
        bom = data.get("linked_bom")
        qty = data.get("qty")
        if not bom:
            raise serializers.ValidationError(
                "linked_bom is required to compute materials snapshot."
            )
        if qty is None or Decimal(qty) <= 0:
            raise serializers.ValidationError("qty must be a positive number.")

        snapshot = m_services.compute_materials_snapshot(bom, Decimal(qty))
        all_ok, details = m_services.check_snapshot_availability(snapshot)

        # pass info to create() via context
        self.context["materials_snapshot"] = snapshot
        self.context["materials_availability"] = details
        self.context["all_materials_available"] = all_ok

        proceed = self.initial_data.get("proceed_when_short", False)
        if not all_ok and not proceed:
            raise serializers.ValidationError(
                {
                    "materials_shortage": details,
                    "message": "Materials shortage detected. Set proceed_when_short=true to create MO in AWAITING_MATERIALS state.",
                }
            )
        return data

    def create(self, validated_data):
        snapshot = self.context.get("materials_snapshot")
        all_ok = self.context.get("all_materials_available", False)
        proceed = validated_data.pop("proceed_when_short", False)
        request_user = (
            self.context.get("request").user if self.context.get("request") else None
        )

        mo = ManufacturingOrder.objects.create(
            materials_snapshot=snapshot,
            status=(
                ManufacturingOrder.Status.PLANNED
                if all_ok
                else ManufacturingOrder.Status.AWAITING_MATERIALS
            ),
            created_by=request_user,
            **validated_data,
        )
        # generate mo_number if desired
        if not mo.mo_number:
            mo.mo_number = f"MO-{mo.pk:06d}"
            mo.save(update_fields=["mo_number"])

        # Auto-generate work orders from linked BOM operations (idempotent)
        try:
            # call service; default auto_generate True. Adjust if you add a config flag later.
            m_services.generate_work_orders_from_mo(mo, auto_generate=True)
        except Exception:
            # do not block MO creation on WO generation errors; log in real app
            pass

        return mo


class MaterialsPreviewSerializer(serializers.Serializer):
    # use plain IntegerField to avoid circular import at module load time
    linked_bom = serializers.IntegerField()
    qty = serializers.DecimalField(max_digits=18, decimal_places=4)

    def validate(self, data):
        if data["qty"] <= 0:
            raise serializers.ValidationError("qty must be > 0")
        # validate linked_bom exists
        from .models import BillOfMaterials

        try:
            BillOfMaterials.objects.get(pk=data["linked_bom"])
        except BillOfMaterials.DoesNotExist:
            raise serializers.ValidationError(
                {"linked_bom": "BillOfMaterials not found."}
            )
        return data

    def to_representation(self, instance):
        from .models import BillOfMaterials

        bom = BillOfMaterials.objects.get(pk=instance["linked_bom"])
        qty = instance["qty"]
        snapshot = m_services.compute_materials_snapshot(bom, qty)
        all_ok, details = m_services.check_snapshot_availability(snapshot)
        return {
            "materials_snapshot": snapshot,
            "all_materials_available": all_ok,
            "materials_availability": details,
        }
