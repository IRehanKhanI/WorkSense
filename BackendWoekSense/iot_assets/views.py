from django.utils import timezone
from rest_framework import viewsets, permissions
from .models import IoTDevice, SensorReading
from .serializers import IoTDeviceSerializer, SensorReadingSerializer


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IoTDeviceViewSet(viewsets.ModelViewSet):
    queryset = IoTDevice.objects.all().select_related('assigned_user')
    serializer_class = IoTDeviceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class SensorReadingViewSet(viewsets.ModelViewSet):
    serializer_class = SensorReadingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = SensorReading.objects.all()
        device_id = self.request.query_params.get('device')
        if device_id:
            qs = qs.filter(device_id=device_id)
        return qs.select_related('device')

    def perform_create(self, serializer):
        instance = serializer.save()
        # Update device last_seen timestamp
        instance.device.last_seen = timezone.now()
        instance.device.status = 'online'
        instance.device.save(update_fields=['last_seen', 'status'])

    def get_permissions(self):
        if self.action in ['destroy', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
