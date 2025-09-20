from rest_framework.routers import DefaultRouter
from .views import ManufacturingOrderViewSet

router = DefaultRouter()
router.register(
    r"manufacturing-orders", ManufacturingOrderViewSet, basename="manufacturingorder"
)

urlpatterns = router.urls
