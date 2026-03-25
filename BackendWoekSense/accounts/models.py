from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    """Extended user profile with role and device fingerprinting"""
    ROLE_CHOICES = [
        ('WORKER', 'Worker'),
        ('SUPERVISOR', 'Supervisor'),
        ('ADMIN', 'Admin'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='WORKER')
    phone_device_id = models.CharField(max_length=255, unique=True)
    is_device_registered = models.BooleanField(default=False)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "User Profiles"
    
    def __str__(self):
        return f"{self.user.username} ({self.role})"


class DeviceSession(models.Model):
    """Track active device sessions to prevent multi-device login"""
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('REVOKED', 'Revoked'),
        ('EXPIRED', 'Expired'),
    ]
    
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='device_sessions')
    device_id = models.CharField(max_length=255)
    token = models.CharField(max_length=255, unique=True)
    login_timestamp = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_activity = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-login_timestamp']
    
    def __str__(self):
        return f"{self.user_profile.user.username} - {self.device_id}"
    
    def is_active(self):
        return self.status == 'ACTIVE' and timezone.now() < self.expires_at


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('supervisor', 'Supervisor'),
        ('worker', 'Worker'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='worker')
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    device_fingerprint = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
