from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.utils import timezone


class Task(models.Model):
    """Tasks assigned to workers"""
    TASK_TYPE_CHOICES = [
        ('SWEEPING', 'Sweeping'),
        ('ROAD_REPAIR', 'Road Repair'),
        ('WATER_MAINTENANCE', 'Water Maintenance'),
        ('GARBAGE_COLLECTION', 'Garbage Collection'),
        ('OTHER', 'Other'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    ]

    task_id = models.CharField(max_length=100, unique=True)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tasks')

    task_type = models.CharField(max_length=50, choices=TASK_TYPE_CHOICES)
    description = models.TextField()
    assigned_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assigned_date']
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['task_id']),
        ]

    def __str__(self):
        return f"{self.task_id} - {self.get_task_type_display()}"


class TaskProof(models.Model):
    """Before/After photos for task proof of completion"""
    PROOF_TYPE_CHOICES = [
        ('BEFORE', 'Before'),
        ('AFTER', 'After'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='proofs')
    proof_type = models.CharField(max_length=20, choices=PROOF_TYPE_CHOICES)
    image = models.ImageField(upload_to='task_proofs/')

    gps_lat = models.FloatField()
    gps_lon = models.FloatField()

    submitted_at = models.DateTimeField(auto_now_add=True)
    watermark_text = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['submitted_at']
        unique_together = ['task', 'proof_type']

    def __str__(self):
        return f"{self.task.task_id} - {self.proof_type}"


class TaskSLA(models.Model):
    """SLA tracking for task completion"""
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='sla')

    before_photo_time = models.DateTimeField()
    after_photo_time = models.DateTimeField()
    duration_minutes = models.IntegerField()

    sla_threshold_minutes = models.IntegerField(default=120)  # Default 2 hours
    sla_met = models.BooleanField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.duration_minutes = int((self.after_photo_time - self.before_photo_time).total_seconds() / 60)
        self.sla_met = self.duration_minutes <= self.sla_threshold_minutes
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.task.task_id} - {self.duration_minutes}min (SLA: {'MET' if self.sla_met else 'MISSED'})"


class CleaningTask(models.Model):
    """Standalone cleaning task with before/after images for AI verification."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('verified_clean', 'Verified Clean'),
        ('verification_failed', 'Verification Failed'),
        ('completed', 'Completed'),
    ]

    task_id = models.CharField(max_length=100, unique=True)
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cleaning_tasks')
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')

    before_image = models.ImageField(upload_to='cleaning_proofs/before/', null=True, blank=True)
    after_image = models.ImageField(upload_to='cleaning_proofs/after/', null=True, blank=True)

    assigned_date = models.DateField(default=timezone.now)
    completion_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assigned_date']
        indexes = [
            models.Index(fields=['worker', 'status']),
            models.Index(fields=['task_id']),
        ]

    def __str__(self):
        return f"{self.task_id} ({self.status}) - {self.worker.username}"


class VerificationResult(models.Model):
    """AI verification result for a CleaningTask before/after comparison."""

    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified_clean', 'Verified Clean'),
        ('incomplete', 'Incomplete'),
        ('error', 'Error'),
    ]

    cleaning_task = models.OneToOneField(CleaningTask, on_delete=models.CASCADE, related_name='verification')

    # Before image analysis
    before_prediction = models.CharField(max_length=50, blank=True)
    before_confidence = models.FloatField(null=True, blank=True)
    before_class_scores = models.JSONField(null=True, blank=True)

    # After image analysis
    after_prediction = models.CharField(max_length=50, blank=True)
    after_confidence = models.FloatField(null=True, blank=True)
    after_class_scores = models.JSONField(null=True, blank=True)

    # Overall result
    cleanup_successful = models.BooleanField(null=True, blank=True)
    cleanup_confidence = models.FloatField(null=True, blank=True)
    verification_status = models.CharField(max_length=30, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    recommendation_message = models.TextField(blank=True)

    # Metadata
    model_version = models.CharField(max_length=50, default="google/vit-base-patch16-224")
    confidence_threshold = models.FloatField(default=0.6)
    verified_at = models.DateTimeField(null=True, blank=True)

    # Error handling
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Verification for {self.cleaning_task.task_id} - {self.verification_status}"


class CleaningMetrics(models.Model):
    """Aggregate performance metrics for a worker's cleaning tasks."""

    worker = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cleaning_metrics')

    total_tasks = models.IntegerField(default=0)
    completed_tasks = models.IntegerField(default=0)
    verified_clean = models.IntegerField(default=0)
    verification_failed = models.IntegerField(default=0)

    success_rate = models.FloatField(default=0.0)
    average_confidence = models.FloatField(default=0.0)

    last_task_date = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_metrics(self):
        """Recalculate and persist worker metrics."""
        tasks = CleaningTask.objects.filter(worker=self.worker)
        verifications = VerificationResult.objects.filter(cleaning_task__worker=self.worker)

        self.total_tasks = tasks.count()
        self.completed_tasks = tasks.filter(status='completed').count()
        self.verified_clean = verifications.filter(verification_status='verified_clean').count()
        self.verification_failed = verifications.filter(verification_status='incomplete').count()

        total_verified = self.verified_clean + self.verification_failed
        if total_verified > 0:
            self.success_rate = (self.verified_clean / total_verified) * 100

        conf_values = list(
            verifications.filter(cleanup_confidence__isnull=False)
            .values_list('cleanup_confidence', flat=True)
        )
        if conf_values:
            self.average_confidence = sum(conf_values) / len(conf_values)

        latest = tasks.order_by('-assigned_date').first()
        self.last_task_date = latest.assigned_date if latest else None
        self.save()

    def __str__(self):
        return f"Metrics for {self.worker.username}"
