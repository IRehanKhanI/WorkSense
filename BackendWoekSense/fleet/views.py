from rest_framework import viewsets, permissions
from .models import Vehicle, VehicleLocation
from .serializers import VehicleSerializer, VehicleLocationSerializer


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().select_related('assigned_driver').prefetch_related('locations')
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class VehicleLocationViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleLocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = VehicleLocation.objects.all()
        vehicle_id = self.request.query_params.get('vehicle')
        if vehicle_id:
            qs = qs.filter(vehicle_id=vehicle_id)
        return qs.select_related('vehicle')

    def get_permissions(self):
        if self.action in ['destroy', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
