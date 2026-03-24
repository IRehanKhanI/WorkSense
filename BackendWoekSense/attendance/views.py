import math
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer


def _haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'supervisor':
            qs = AttendanceRecord.objects.all()
        else:
            qs = AttendanceRecord.objects.filter(user=user)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        return qs.select_related('user').order_by('-date')

    @action(detail=False, methods=['post'])
    def clock_in(self, request):
        user = request.user
        today = timezone.localdate()
        record, _ = AttendanceRecord.objects.get_or_create(user=user, date=today)
        if record.clock_in:
            return Response({'detail': 'Already clocked in today.'}, status=status.HTTP_400_BAD_REQUEST)

        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        geofence_ok = False
        if lat and lng:
            dist = _haversine(
                float(lat), float(lng),
                getattr(settings, 'GEOFENCE_LAT', 33.6844),
                getattr(settings, 'GEOFENCE_LNG', 73.0479),
            )
            geofence_ok = dist <= getattr(settings, 'GEOFENCE_RADIUS_M', 200)

        record.clock_in = timezone.now()
        record.clock_in_lat = lat
        record.clock_in_lng = lng
        record.is_geofence_valid = geofence_ok
        record.device_fingerprint = request.data.get('device_fingerprint', '')
        record.selfie_url = request.data.get('selfie_url', '')
        record.save()
        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def clock_out(self, request):
        user = request.user
        today = timezone.localdate()
        try:
            record = AttendanceRecord.objects.get(user=user, date=today)
        except AttendanceRecord.DoesNotExist:
            return Response({'detail': 'No clock-in record for today.'}, status=status.HTTP_404_NOT_FOUND)
        if record.clock_out:
            return Response({'detail': 'Already clocked out today.'}, status=status.HTTP_400_BAD_REQUEST)

        record.clock_out = timezone.now()
        record.clock_out_lat = request.data.get('latitude')
        record.clock_out_lng = request.data.get('longitude')
        record.save()
        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)
