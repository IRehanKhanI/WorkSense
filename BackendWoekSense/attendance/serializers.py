from rest_framework import serializers
from .models import WorkZone, AttendanceLog, AttendanceRecord


class WorkZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkZone
        fields = ['id', 'zone_id', 'zone_name', 'center_lat', 'center_lon', 'radius_km']
        read_only_fields = ['id']


class ClockInSerializer(serializers.Serializer):
    """Serializer for clock-in submission"""
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    vpn_detected = serializers.BooleanField(default=False)
    dev_mode_detected = serializers.BooleanField(default=False)
    zone_id = serializers.CharField(required=False, allow_blank=True)
    selfie = serializers.ImageField(required=False)
    
    # Read-only response fields
    attendance_status = serializers.CharField(read_only=True)
    is_within_geofence = serializers.BooleanField(read_only=True)
    clock_in_time = serializers.DateTimeField(read_only=True)
    message = serializers.CharField(read_only=True)


class AttendanceLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    zone_name = serializers.CharField(source='assigned_zone.zone_name', read_only=True, allow_null=True)
    
    class Meta:
        model = AttendanceLog
        fields = [
            'id',
            'username',
            'clock_in_lat',
            'clock_in_lon',
            'clock_in_time',
            'zone_name',
            'is_within_geofence',
            'vpn_detected',
            'dev_mode_detected',
            'mock_location_detected',
            'attendance_status',
            'rejection_reason',
        ]
        read_only_fields = ['id', 'clock_in_time']

class AttendanceRecordSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)    

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'user', 'username', 'date', 'status',
            'clock_in', 'clock_out',
            'clock_in_lat', 'clock_in_lng',
            'clock_out_lat', 'clock_out_lng',
            'selfie_url', 'device_fingerprint', 'is_geofence_valid',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
