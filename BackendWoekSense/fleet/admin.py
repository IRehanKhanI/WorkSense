from django.contrib import admin
from .models import Vehicle, VehicleLocation


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['registration', 'make', 'model', 'year', 'status', 'assigned_driver']
    list_filter = ['status']
    search_fields = ['registration', 'make', 'model']


@admin.register(VehicleLocation)
class VehicleLocationAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'latitude', 'longitude', 'speed_kmh', 'timestamp']
    list_filter = ['vehicle']
    ordering = ['-timestamp']
