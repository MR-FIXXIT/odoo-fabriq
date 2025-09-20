from rest_framework import serializers
from decimal import Decimal
from .models import ManufacturingOrder
from . import services as m_services


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
