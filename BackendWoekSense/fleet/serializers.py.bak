from rest_framework import serializers
<<<<<<< HEAD
from .models import Vehicle, GpsLocation, RouteDeviation

# Placeholder - serializers to be extended
=======
from .models import Vehicle, VehicleLocation


class VehicleLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleLocation
        fields = ['id', 'vehicle', 'latitude', 'longitude', 'speed_kmh', 'heading', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class VehicleSerializer(serializers.ModelSerializer):
    latest_location = serializers.SerializerMethodField()
    assigned_driver_name = serializers.CharField(source='assigned_driver.username', read_only=True, allow_null=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'registration', 'make', 'model', 'year', 'status',
            'assigned_driver', 'assigned_driver_name',
            'latest_location', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_latest_location(self, obj):
        loc = obj.locations.first()
        if loc:
            return VehicleLocationSerializer(loc).data
        return None
>>>>>>> dc4d18bafcd4ef40f049d51a2ce3d7f6304db71e
