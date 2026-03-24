from rest_framework import serializers
from .models import AttendanceRecord


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
