from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "sku",
            "name",
            "description",
            "product_type",
            "stock_quantity",
            "unit_of_measure",
            "reorder_level",
            "default_warehouse",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "stock_quantity",
        ]

    def validate_sku(self, value):
        # normalize SKU
        return value.strip().upper()

    def create(self, validated_data):
        user = self.context.get("request").user
        validated_data.setdefault(
            "created_by", user if user and user.is_authenticated else None
        )
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # prevent accidental stock_quantity edits from product edit UI (use inventory APIs)
        if "stock_quantity" in validated_data:
            validated_data.pop("stock_quantity")
        return super().update(instance, validated_data)
