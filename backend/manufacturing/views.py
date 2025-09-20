from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ManufacturingOrder, BillOfMaterials, WorkCenter, WorkOrder
from .serializers import (
    ManufacturingOrderCreateSerializer,
    MaterialsPreviewSerializer,
    BOMSerializer,
    WorkCenterSerializer,
    WorkOrderSerializer,
    ManufacturingOrderDetailSerializer,
)
from . import services as m_services


# permissions reused from earlier (keeps thin)
class IsInventoryManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or request.user.groups.filter(
                    name__in=["OWNER", "ADMIN", "INVENTORY_MANAGER"]
                ).exists()
            )
        )


class IsManufacturingManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (
            request.user.is_staff
            or request.user.groups.filter(
                name__in=["OWNER", "ADMIN", "MANUFACTURING_MANAGER"]
            ).exists()
        )


class WorkCenterViewSet(viewsets.ModelViewSet):
    queryset = WorkCenter.objects.all().order_by("name")
    serializer_class = WorkCenterSerializer
    permission_classes = [IsInventoryManagerOrReadOnly]


class BOMViewSet(viewsets.ModelViewSet):
    queryset = BillOfMaterials.objects.all().order_by("-created_at")
    serializer_class = BOMSerializer
    permission_classes = [IsInventoryManagerOrReadOnly]

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsInventoryManagerOrReadOnly],
        url_path="items",
    )
    def add_item(self, request, pk=None):
        """
        POST /api/manufacturing/boms/{pk}/items/ with payload {"component": <id>, "qty_per_unit": "0.5", "scrap_pct": "1.0"}
        Adds one BOMItem to the BOM (convenience endpoint).
        """
        bom = self.get_object()
        serializer = BOMItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        BOMItem.objects.create(bom=bom, **serializer.validated_data)
        return Response({"status": "created"}, status=status.HTTP_201_CREATED)


class ManufacturingOrderViewSet(viewsets.ModelViewSet):
    queryset = ManufacturingOrder.objects.all().order_by("-created_at")
    permission_classes = [IsManufacturingManagerOrReadOnly]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ManufacturingOrderDetailSerializer
        return ManufacturingOrderCreateSerializer

    def create(self, request, *args, **kwargs):
        # reuse existing create that returns availability details
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        mo = serializer.save()
        out = self.get_serializer(mo).data
        avail = serializer.context.get("materials_availability")
        if avail is not None:
            out["materials_availability"] = avail
            out["all_materials_available"] = serializer.context.get(
                "all_materials_available", False
            )
        return Response(out, status=status.HTTP_201_CREATED)


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all().order_by("mo", "operation_no")
    serializer_class = WorkOrderSerializer
    permission_classes = [IsManufacturingManagerOrReadOnly]

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="status",
    )
    def change_status(self, request, pk=None):
        """
        PATCH /api/manufacturing/work-orders/{id}/status/  body: {"action": "start"|"pause"|"complete"|"assign", "assigned_to": <user_id>}
        On complete -> call manufacturing.services.complete_work_order (it will call inventory apply_wo_completion if available)
        """
        wo = self.get_object()
        action = request.data.get("action")
        user = request.user

        if action == "assign":
            assigned_to = request.data.get("assigned_to")
            if assigned_to:
                from django.contrib.auth import get_user_model

                User = get_user_model()
                try:
                    assignee = User.objects.get(pk=assigned_to)
                except User.DoesNotExist:
                    return Response(
                        {"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST
                    )
                wo.assigned_to = assignee
                wo.status = WorkOrder.Status.ASSIGNED
                wo.save(update_fields=["assigned_to", "status"])
                return Response(WorkOrderSerializer(wo).data)

        if action == "start":
            wo.status = WorkOrder.Status.STARTED
            wo.started_at = timezone.now()
            wo.save(update_fields=["status", "started_at"])
            return Response(WorkOrderSerializer(wo).data)

        if action == "pause":
            wo.status = WorkOrder.Status.PAUSED
            wo.save(update_fields=["status"])
            return Response(WorkOrderSerializer(wo).data)

        if action == "complete":
            # delegate to service (may call inventory.services.apply_wo_completion)
            try:
                result = m_services.complete_work_order(wo, completed_by=user)
            except NotImplementedError as e:
                return Response(
                    {"detail": str(e)}, status=status.HTTP_501_NOT_IMPLEMENTED
                )
            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            return Response(result)
        return Response(
            {"detail": "unknown action"}, status=status.HTTP_400_BAD_REQUEST
        )
