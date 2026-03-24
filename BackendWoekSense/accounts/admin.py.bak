from django.contrib import admin
<<<<<<< HEAD
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'department', 'employee_id', 'is_active']
    list_filter = ['role', 'is_active', 'department']
    fieldsets = UserAdmin.fieldsets + (
        ('WorkSense', {'fields': ('role', 'phone', 'department', 'employee_id', 'device_fingerprint')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('WorkSense', {'fields': ('role', 'phone', 'department', 'employee_id')}),
    )
=======
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

>>>>>>> copilot/vscode-mn4q5as7-92i0
