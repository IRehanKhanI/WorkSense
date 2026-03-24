from django.contrib import admin
from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'status', 'clock_in', 'clock_out', 'is_geofence_valid']
    list_filter = ['status', 'date', 'is_geofence_valid']
    search_fields = ['user__username']
    ordering = ['-date']
