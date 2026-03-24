from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from geopy.distance import geodesic

class WorkZone(models.Model):
    """Geographic zones where workers are assigned"""
    zone_id = models.CharField(max_length=100, unique=True)
    zone_name = models.CharField(max_length=255)
    center_lat = models.FloatField()
    center_lon = models.FloatField()
    radius_km = models.FloatField(default=5.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['zone_name']
    
    def __str__(self):
        return f"{self.zone_name} (R: {self.radius_km}km)"
    
    def is_within_zone(self, lat, lon):
        """Check if coordinates are within this zone"""
        user_coords = (lat, lon)
        zone_coords = (self.center_lat, self.center_lon)
        distance_km = geodesic(user_coords, zone_coords).kilometers
        return distance_km <= self.radius_km


class AttendanceLog(models.Model):
    """Clock-in records with anti-spoofing measures"""
    STATUS_CHOICES = [
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_logs')
    clock_in_lat = models.FloatField()
    clock_in_lon = models.FloatField()
    clock_in_time = models.DateTimeField(auto_now_add=True)  # Server time, not phone time
    assigned_zone = models.ForeignKey(WorkZone, on_delete=models.SET_NULL, null=True, blank=True)
    is_within_geofence = models.BooleanField(default=False)
    
    # Anti-spoofing flags
    vpn_detected = models.BooleanField(default=False)
    dev_mode_detected = models.BooleanField(default=False)
    mock_location_detected = models.BooleanField(default=False)
    
    # Result
    attendance_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACCEPTED')
    rejection_reason = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Reason for rejection if status is REJECTED"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-clock_in_time']
        indexes = [
            models.Index(fields=['user', 'clock_in_time']),
            models.Index(fields=['attendance_status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.clock_in_time} ({self.attendance_status})"

