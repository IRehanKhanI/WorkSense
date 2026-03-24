from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from .models import WorkZone, AttendanceLog, AttendanceRecord
from .serializers import WorkZoneSerializer, AttendanceLogSerializer, ClockInSerializer, AttendanceRecordSerializer
from .utils import validate_clock_in
from ml_models.face_recognition_service import verify_face_in_image


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
        
        selfie = request.FILES.get('selfie') or serializer.validated_data.get('selfie')
        face_verified = False

        if selfie:
            selfie_bytes = selfie.read()
            # Seek back to 0 so it can still be saved correctly in Django models later
            selfie.seek(0)
            
            is_valid_face, message = verify_face_in_image(selfie_bytes)
            # For development/testing, we won't block the request if face recognition fails
            if not is_valid_face:
                face_verified = False
            else:
                face_verified = True
        
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
            rejection_reason=validation_result['rejection_reason'],
            selfie=selfie,
            face_verified=face_verified
        )
        
        if validation_result['is_valid']:
            today = timezone.localdate()
            record, _ = AttendanceRecord.objects.get_or_create(user=request.user, date=today)
            if not record.clock_in:
                record.clock_in = timezone.now()
                record.clock_in_lat = lat
                record.clock_in_lng = lon
                record.is_geofence_valid = validation_result['is_within_geofence']
                record.status = 'present'
                record.save()
            return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_201_CREATED)
        else:
            response_data = {
                'attendance_status': attendance.attendance_status,
                'is_within_geofence': attendance.is_within_geofence,
                'clock_in_time': attendance.clock_in_time,
                'message': validation_result['rejection_reason'] or 'Clock-in failed'
            }
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
        
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

    def list(self, request):
        """Get today's and history generic records"""
        user = self.request.user
        qs = AttendanceRecord.objects.filter(user=user)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        qs = qs.select_related('user').order_by('-date')
        serializer = AttendanceRecordSerializer(qs, many=True)
        return Response({'results': serializer.data})
        
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get current user's attendance statistics"""
        logs = AttendanceLog.objects.filter(user=request.user)
        total_logs = logs.count()
        accepted_logs = logs.filter(attendance_status='ACCEPTED').count()
        rejected_logs = logs.filter(attendance_status='REJECTED').count()
        
        # Today's status
        today = timezone.now().date()
        today_logs = logs.filter(clock_in_time__date=today).order_by('-clock_in_time')
        
        today_clock_in = None
        has_clocked_in_today = False
        
        if today_logs.exists():
            today_clock_in = today_logs.last().clock_in_time  # First clock in of the day
            has_clocked_in_today = True

        return Response({
            'total_logs': total_logs,
            'accepted_logs': accepted_logs,
            'rejected_logs': rejected_logs,
            'today_clock_in': today_clock_in,
            'has_clocked_in_today': has_clocked_in_today,
            'attendance_rate': round((accepted_logs / total_logs * 100) if total_logs > 0 else 0, 2)
        }, status=status.HTTP_200_OK)
    
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

