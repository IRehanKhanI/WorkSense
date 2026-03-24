from rest_framework import serializers
<<<<<<< HEAD
from .models import SmartDustbin, BinVolumeData, AlertEvent

# Placeholder - serializers to be extended
=======
from .models import IoTDevice, SensorReading


class SensorReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorReading
        fields = ['id', 'device', 'metric', 'value', 'unit', 'latitude', 'longitude', 'recorded_at']
        read_only_fields = ['id', 'recorded_at']


class IoTDeviceSerializer(serializers.ModelSerializer):
    assigned_user_name = serializers.CharField(source='assigned_user.username', read_only=True, allow_null=True)
    latest_reading = serializers.SerializerMethodField()

    class Meta:
        model = IoTDevice
        fields = [
            'id', 'device_id', 'name', 'device_type', 'status',
            'location_description', 'assigned_user', 'assigned_user_name',
            'last_seen', 'latest_reading', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_latest_reading(self, obj):
        reading = obj.readings.first()
        if reading:
            return SensorReadingSerializer(reading).data
        return None
>>>>>>> dc4d18bafcd4ef40f049d51a2ce3d7f6304db71e
