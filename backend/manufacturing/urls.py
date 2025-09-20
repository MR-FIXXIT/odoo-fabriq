from rest_framework.routers import DefaultRouter
from .views import (
    ManufacturingOrderViewSet,
    BOMViewSet,
    WorkCenterViewSet,
    WorkOrderViewSet,
)

router = DefaultRouter()
router.register(
    r"manufacturing-orders", ManufacturingOrderViewSet, basename="manufacturingorder"
)
router.register(r"boms", BOMViewSet, basename="bom")
router.register(r"workcenters", WorkCenterViewSet, basename="workcenter")
router.register(r"work-orders", WorkOrderViewSet, basename="workorder")

urlpatterns = router.urls
