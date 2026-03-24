<<<<<<< HEAD
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
=======
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from .models import WorkZone, AttendanceLog
from .serializers import WorkZoneSerializer, AttendanceLogSerializer, ClockInSerializer
from .utils import validate_clock_in


class WorkZoneViewSet(viewsets.ModelViewSet):
    """API for work zone management"""
    queryset = WorkZone.objects.all()
    serializer_class = WorkZoneSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Admin sees all zones, workers see assigned zones (simplified for now)
        return WorkZone.objects.all()


class AttendanceViewSet(viewsets.ViewSet):
    """API for attendance clock-in and history"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def clock_in(self, request):
        """
        Submit clock-in with GPS coordinates and anti-spoofing flags
        
        Expected payload:
        {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "vpn_detected": false,
            "dev_mode_detected": false,
            "zone_id": "zone-001"  (optional)
        }
        """
        serializer = ClockInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        lat = serializer.validated_data['latitude']
        lon = serializer.validated_data['longitude']
        vpn_flag = serializer.validated_data['vpn_detected']
        dev_flag = serializer.validated_data['dev_mode_detected']
        zone_id = serializer.validated_data.get('zone_id', '')
        
        # Get assigned zone (if specified)
        assigned_zone = None
        if zone_id:
            try:
                assigned_zone = WorkZone.objects.get(zone_id=zone_id)
            except WorkZone.DoesNotExist:
                pass
        
        # Validate clock-in
        validation_result = validate_clock_in(
            request.user, lat, lon, vpn_flag, dev_flag, assigned_zone
        )
        
        # Create attendance log
        attendance = AttendanceLog.objects.create(
            user=request.user,
            clock_in_lat=lat,
            clock_in_lon=lon,
            assigned_zone=assigned_zone,
            is_within_geofence=validation_result['is_within_geofence'],
            vpn_detected=vpn_flag,
            dev_mode_detected=dev_flag,
            attendance_status=validation_result['status'],
            rejection_reason=validation_result['rejection_reason']
        )
        
        response_data = {
            'attendance_status': attendance.attendance_status,
            'is_within_geofence': attendance.is_within_geofence,
            'clock_in_time': attendance.clock_in_time,
            'message': validation_result['rejection_reason'] or 'Clock-in successful'
        }
        
        status_code = status.HTTP_201_CREATED if validation_result['is_valid'] else status.HTTP_400_BAD_REQUEST
        return Response(response_data, status=status_code)
    
    @action(detail=False, methods=['get'])
    def logs(self, request):
        """Get current user's attendance history"""
        logs = AttendanceLog.objects.filter(user=request.user).order_by('-clock_in_time')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        start = (page - 1) * limit
        end = start + limit
        
        total = logs.count()
        logs_page = logs[start:end]
        
        serializer = AttendanceLogSerializer(logs_page, many=True)
        return Response({
            'count': total,
            'page': page,
            'limit': limit,
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def admin_logs(self, request):
        """Get all attendance logs (admin only)"""
        # Check if user is admin
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'ADMIN':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Filter by date range if provided
        logs = AttendanceLog.objects.all().order_by('-clock_in_time')
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        status_filter = request.query_params.get('status')
        username = request.query_params.get('username')
        
        if start_date:
            logs = logs.filter(clock_in_time__gte=start_date)
        if end_date:
            logs = logs.filter(clock_in_time__lte=end_date)
        if status_filter:
            logs = logs.filter(attendance_status=status_filter)
        if username:
            logs = logs.filter(user__username__icontains=username)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        start = (page - 1) * limit
        end = start + limit
        
        total = logs.count()
        logs_page = logs[start:end]
        
        serializer = AttendanceLogSerializer(logs_page, many=True)
        return Response({
            'count': total,
            'page': page,
            'limit': limit,
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def zones(self, request):
        """Get available work zones for user"""
        zones = WorkZone.objects.all()
        serializer = WorkZoneSerializer(zones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

>>>>>>> copilot/vscode-mn4q5as7-92i0
