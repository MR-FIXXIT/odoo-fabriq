from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Product
from .serializers import ProductSerializer


class IsInventoryManagerOrReadOnly(permissions.BasePermission):
    """
    Allow write access only to users in INVENTORY_MANAGER, OWNER or ADMIN groups.
    Read access to authenticated users (or adjust as needed).
    """

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


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("sku")
    serializer_class = ProductSerializer
    permission_classes = [IsInventoryManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["sku", "name", "product_type"]
    search_fields = ["sku", "name", "description"]
    ordering_fields = ["sku", "name", "reorder_level"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
