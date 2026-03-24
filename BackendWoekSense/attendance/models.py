from django.conf import settings
from django.db import models


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('half_day', 'Half Day'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')

    # GPS coordinates at clock-in / clock-out
    clock_in_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    clock_in_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    clock_out_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    clock_out_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    # Verification
    selfie_url = models.URLField(blank=True)
    device_fingerprint = models.CharField(max_length=255, blank=True)
    is_geofence_valid = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} – {self.date} ({self.status})"
