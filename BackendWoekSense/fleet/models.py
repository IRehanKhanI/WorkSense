from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Vehicle(models.Model):
    """Vehicle tracking for garbage trucks and maintenance vehicles"""
    VEHICLE_TYPE_CHOICES = [
        ('GARBAGE_TRUCK', 'Garbage Truck'),
        ('MAINTENANCE_VEHICLE', 'Maintenance Vehicle'),
    ]
    STATUS_CHOICES = [
        ('IDLE', 'Idle'),
        ('ACTIVE', 'Active'),
        ('MAINTENANCE', 'Maintenance'),
    ]
    
    vehicle_id = models.CharField(max_length=100, unique=True)
    vehicle_type = models.CharField(max_length=50, choices=VEHICLE_TYPE_CHOICES)
    assigned_driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='vehicles')
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IDLE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.vehicle_id} ({self.get_vehicle_type_display()})"


class AssignedRoute(models.Model):
    """Predefined routes for vehicles"""
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='routes')
    route_name = models.CharField(max_length=255)
    assigned_date = models.DateField()
    scheduled_stops = models.JSONField()  # [{stop_id, lat, lon, stop_name}, ...]
    stop_tolerance_meters = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.vehicle.vehicle_id} - {self.route_name}"


class GpsLocation(models.Model):
    """Live GPS tracking data"""
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='gps_locations')
    latitude = models.FloatField()
    longitude = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)
    accuracy = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [models.Index(fields=['vehicle', '-timestamp'])]
    
    def __str__(self):
        return f"{self.vehicle.vehicle_id} - {self.timestamp}"


class RouteDeviation(models.Model):
    """Alert for skipped stops"""
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='deviations')
    skipped_stop_id = models.CharField(max_length=100)
    detected_at = models.DateTimeField(auto_now_add=True)
    alert_sent_to_admin = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.vehicle.vehicle_id} - Skipped {self.skipped_stop_id}"


class VehicleLocation(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='locations')
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    speed_kmh = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    heading = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.vehicle.vehicle_id} @ {self.timestamp}"



