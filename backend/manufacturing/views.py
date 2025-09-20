from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ManufacturingOrder
from .serializers import ManufacturingOrderCreateSerializer, MaterialsPreviewSerializer
from . import services as m_services


class IsManufacturingManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        # allow create/update only for users in OWNER/ADMIN/MANAGER groups
        return request.user.is_authenticated and (
            request.user.is_staff
            or request.user.groups.filter(
                name__in=["OWNER", "ADMIN", "MANUFACTURING_MANAGER"]
            ).exists()
        )


class ManufacturingOrderViewSet(viewsets.ModelViewSet):
    queryset = ManufacturingOrder.objects.all().order_by("-created_at")
    serializer_class = ManufacturingOrderCreateSerializer
    permission_classes = [IsManufacturingManagerOrReadOnly]

    # optionally override create to return availability details in response
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        mo = serializer.save()
        out = self.get_serializer(mo).data
        # attach availability info if present
        avail = serializer.context.get("materials_availability")
        if avail is not None:
            out["materials_availability"] = avail
            out["all_materials_available"] = serializer.context.get(
                "all_materials_available", False
            )
        return Response(out, status=status.HTTP_201_CREATED)

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def preview_materials(self, request):
        """
        GET /api/manufacturing/orders/preview_materials/?linked_bom=<id>&qty=10
        Returns computed materials_snapshot and availability details without creating an MO.
        """
        data = {
            "linked_bom": request.query_params.get("linked_bom"),
            "qty": request.query_params.get("qty"),
        }
        serializer = MaterialsPreviewSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
