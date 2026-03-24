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

