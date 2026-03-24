from django.conf import settings
from django.db import models


class IoTDevice(models.Model):
    TYPE_CHOICES = [
        ('gps_tracker', 'GPS Tracker'),
        ('temperature', 'Temperature Sensor'),
        ('humidity', 'Humidity Sensor'),
        ('motion', 'Motion Sensor'),
        ('camera', 'Camera'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('maintenance', 'Maintenance'),
    ]

    device_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    device_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    location_description = models.CharField(max_length=255, blank=True)
    assigned_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='iot_devices',
    )
    last_seen = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.device_id})"


class SensorReading(models.Model):
    device = models.ForeignKey(IoTDevice, on_delete=models.CASCADE, related_name='readings')
    metric = models.CharField(max_length=100)
    value = models.FloatField()
    unit = models.CharField(max_length=30, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.device.device_id}: {self.metric}={self.value}{self.unit}"
