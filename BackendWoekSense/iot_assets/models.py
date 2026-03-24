from django.conf import settings
from django.db import models
from django.utils import timezone


class SmartDustbin(models.Model):
    """Smart dustbins with volume sensors"""
    STATUS_CHOICES = [
        ('OPERATIONAL', 'Operational'),
        ('FAULTY', 'Faulty'),
        ('SCHEDULED_MAINTENANCE', 'Scheduled Maintenance'),
    ]
    
    bin_id = models.CharField(max_length=100, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    max_capacity_liters = models.IntegerField(default=50)
    alert_threshold = models.FloatField(default=0.8)
    location_name = models.CharField(max_length=255)
    maintenance_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='OPERATIONAL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.bin_id} - {self.location_name}"


class BinVolumeData(models.Model):
    """Volume readings from dustbin sensors"""
    dustbin = models.ForeignKey(SmartDustbin, on_delete=models.CASCADE, related_name='volume_data')
    volume_liters = models.FloatField()
    timestamp = models.DateTimeField()
    sensor_accuracy = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [models.Index(fields=['dustbin', '-timestamp'])]
    
    def __str__(self):
        return f"{self.dustbin.bin_id} - {self.volume_liters}L"


class AlertEvent(models.Model):
    """SMS alert events"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    
    dustbin = models.ForeignKey(SmartDustbin, on_delete=models.CASCADE, related_name='alerts')
    trigger_volume = models.FloatField()
    alert_sent_at = models.DateTimeField(auto_now_add=True)
    sms_recipient_numbers = models.JSONField()
    twilio_message_sid = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    def __str__(self):
        return f"{self.dustbin.bin_id} - {self.status}"

<<<<<<< HEAD

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
=======
>>>>>>> copilot/vscode-mn4q5as7-92i0
