from django.contrib import admin
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
