from django.conf import settings
from django.db import models


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
