from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from . import services as analytics_services


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # allow only OWNER/ADMIN users to see analytics; adjust to your auth model
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.is_staff
            or request.user.groups.filter(name__in=["OWNER", "ADMIN"]).exists()
        )


class AnalyticsOverviewView(APIView):
    permission_classes = [IsOwnerOrReadOnly]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        if days <= 0:
            return Response(
                {"detail": "days must be > 0"}, status=status.HTTP_400_BAD_REQUEST
            )
        data = analytics_services.compute_overview(days=days)
        return Response(data)
