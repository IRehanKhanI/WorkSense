from django.contrib import admin
from .models import Vehicle, VehicleLocation


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['vehicle_id', 'vehicle_type', 'current_status', 'assigned_driver']
    list_filter = ['current_status']
    search_fields = ['vehicle_id', 'vehicle_type']


@admin.register(VehicleLocation)
class VehicleLocationAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'latitude', 'longitude', 'speed_kmh', 'timestamp']
    list_filter = ['vehicle']
    ordering = ['-timestamp']
