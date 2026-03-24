from django.contrib import admin
from .models import IoTDevice, SensorReading


@admin.register(IoTDevice)
class IoTDeviceAdmin(admin.ModelAdmin):
    list_display = ['device_id', 'name', 'device_type', 'status', 'assigned_user', 'last_seen']
    list_filter = ['device_type', 'status']
    search_fields = ['device_id', 'name']


@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = ['device', 'metric', 'value', 'unit', 'recorded_at']
    list_filter = ['device', 'metric']
    ordering = ['-recorded_at']
