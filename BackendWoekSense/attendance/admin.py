from django.contrib import admin
from .models import WorkZone, AttendanceLog


@admin.register(WorkZone)
class WorkZoneAdmin(admin.ModelAdmin):
    list_display = ['zone_id', 'zone_name', 'radius_km', 'created_at']
    search_fields = ['zone_id', 'zone_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Zone Details', {'fields': ('zone_id', 'zone_name', 'radius_km')}),
        ('Coordinates', {'fields': ('center_lat', 'center_lon')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'clock_in_time', 'attendance_status', 'is_within_geofence', 'vpn_detected']
    list_filter = ['attendance_status', 'is_within_geofence', 'vpn_detected', 'dev_mode_detected', 'clock_in_time']
    search_fields = ['user__username']
    readonly_fields = ['clock_in_time', 'created_at', 'updated_at']
    date_hierarchy = 'clock_in_time'
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Location', {'fields': ('clock_in_lat', 'clock_in_lon', 'assigned_zone', 'is_within_geofence')}),
        ('Anti-Spoofing', {'fields': ('vpn_detected', 'dev_mode_detected', 'mock_location_detected')}),
        ('Result', {'fields': ('attendance_status', 'rejection_reason')}),
        ('Timestamps', {'fields': ('clock_in_time', 'created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

