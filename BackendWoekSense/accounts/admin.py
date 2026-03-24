from django.contrib import admin
from .models import UserProfile, DeviceSession


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone_device_id', 'is_device_registered', 'created_at']
    list_filter = ['role', 'is_device_registered', 'created_at']
    search_fields = ['user__username', 'phone_device_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Profile', {'fields': ('role', 'phone_device_id', 'is_device_registered')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(DeviceSession)
class DeviceSessionAdmin(admin.ModelAdmin):
    list_display = ['user_profile', 'device_id', 'status', 'login_timestamp', 'expires_at']
    list_filter = ['status', 'login_timestamp']
    search_fields = ['user_profile__user__username', 'device_id']
    readonly_fields = ['login_timestamp', 'last_activity']
    
    fieldsets = (
        ('Device', {'fields': ('user_profile', 'device_id', 'token')}),
        ('Session', {'fields': ('status', 'ip_address', 'user_agent')}),
        ('Timestamps', {'fields': ('login_timestamp', 'last_activity', 'expires_at')}),
    )

