from django.conf import settings
from django.db import models
from django.utils import timezone


class CitizenComplaint(models.Model):
    """Complaints from citizens about uncompleted work"""
    COMPLAINT_TYPE_CHOICES = [
        ('MISSING_COLLECTION', 'Missing Collection'),
        ('INCOMPLETE_WORK', 'Incomplete Work'),
        ('POOR_SERVICE', 'Poor Service'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('ASSIGNED', 'Assigned'),
        ('RESOLVED', 'Resolved'),
    ]
    
    complaint_id = models.CharField(max_length=100, unique=True)
    submitted_by = models.CharField(max_length=255)
    complaint_type = models.CharField(max_length=50, choices=COMPLAINT_TYPE_CHOICES)
    latitude = models.FloatField()
    longitude = models.FloatField()
    description = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    
    class Meta:
        ordering = ['-submitted_at']
        indexes = [models.Index(fields=['status', '-submitted_at'])]
    
    def __str__(self):
        return f"{self.complaint_id} - {self.get_complaint_type_display()}"


class HeatmapDataPoint(models.Model):
    """Aggregated heatmap data for complaint density"""
    grid_lat = models.FloatField()
    grid_lon = models.FloatField()
    complaint_density = models.IntegerField(default=0)
    avg_task_completion_delay_minutes = models.IntegerField(null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField()
    
    class Meta:
        ordering = ['-generated_at']
        unique_together = ['grid_lat', 'grid_lon', 'generated_at']
    
    def __str__(self):
        return f"({self.grid_lat:.4f}, {self.grid_lon:.4f}) - Density: {self.complaint_density}"

<<<<<<< HEAD

class Report(models.Model):
    TYPE_CHOICES = [
        ('attendance', 'Attendance Report'),
        ('task', 'Task Report'),
        ('fleet', 'Fleet Report'),
        ('iot', 'IoT / Sensor Report'),
        ('custom', 'Custom Report'),
    ]
    FORMAT_CHOICES = [
        ('json', 'JSON'),
        ('csv', 'CSV'),
        ('pdf', 'PDF'),
    ]

    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='json')
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reports',
    )
    parameters = models.JSONField(default=dict, blank=True)
    file_url = models.URLField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.title} ({self.report_type}) – {self.generated_at:%Y-%m-%d}"
=======
>>>>>>> copilot/vscode-mn4q5as7-92i0
