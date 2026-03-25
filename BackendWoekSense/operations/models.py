from django.conf import settings
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
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_tasks')
    
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
        ('DURING', 'During'),
        ('AFTER', 'After'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='proofs')
    proof_type = models.CharField(max_length=20, choices=PROOF_TYPE_CHOICES)
    image = models.ImageField(upload_to='task_proofs/')
    worker_selfie = models.ImageField(upload_to='task_proofs/selfies/', null=True, blank=True)

    gps_lat = models.FloatField()
    gps_lon = models.FloatField()
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    watermark_text = models.CharField(max_length=255)
    
    # Image quality metrics
    image_quality_score = models.IntegerField(default=0, help_text="Image quality score 0-100")
    image_blur_detection = models.BooleanField(default=False, help_text="True if image is blurry")
    image_contrast_level = models.FloatField(default=0.0, help_text="Image contrast level")
    
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

class VerificationResult(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('verified_clean', 'Verified Clean'),
        ('incomplete', 'Incomplete'),
        ('failed', 'Failed'),
    ]
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='verification_result')
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='failed')
    cleanup_confidence = models.FloatField(null=True, blank=True)

    recommendation_message = models.TextField(blank=True)
    
    # Metadata
    model_version = models.CharField(max_length=50, default="vit-base-patch16-224")
    confidence_threshold = models.FloatField(default=0.6)
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Verification for {self.task.task_id} - {self.verification_status}"


class CleaningMetrics(models.Model):
    """Track metrics for cleaning verification system."""
    
    worker = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cleaning_metrics')
    
    total_tasks = models.IntegerField(default=0)
    completed_tasks = models.IntegerField(default=0)
    verified_clean = models.IntegerField(default=0)
    verification_failed = models.IntegerField(default=0)
    
    success_rate = models.FloatField(default=0.0)  # percentage successful
    average_confidence = models.FloatField(default=0.0)  # average verification confidence
    
    last_task_date = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_metrics(self):
        """Recalculate worker's metrics."""
        tasks = Task.objects.filter(assigned_to=self.worker)
        verifications = VerificationResult.objects.filter(
            task__assigned_to=self.worker
        )
        
        self.total_tasks = tasks.count()
        self.completed_tasks = tasks.filter(status='COMPLETED').count()
        self.verified_clean = verifications.filter(
            verification_status='verified_clean'
        ).count()
        self.verification_failed = verifications.filter(
            verification_status='incomplete'
        ).count()
        
        if self.verified_clean + self.verification_failed > 0:
            self.success_rate = (
                self.verified_clean / 
                (self.verified_clean + self.verification_failed) * 100
            )
        
        avg_conf = verifications.filter(
            cleanup_confidence__isnull=False
        ).values_list('cleanup_confidence', flat=True)
        if avg_conf:
            self.average_confidence = sum(avg_conf) / len(avg_conf)
        
        self.last_task_date = tasks.order_by('-assigned_date').first().assigned_date if tasks.exists() else None
        self.save()
    
    def __str__(self):
        return f"Metrics for {self.worker.username}"


class TaskCompletionReport(models.Model):
    """Auto-generated completion report with 5-category analysis for completed tasks"""
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='completion_report')
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='completion_reports')
    
    # 5-Category Analysis
    time_analysis_text = models.TextField(help_text="Time Analysis: actual duration vs SLA threshold")
    location_analysis_text = models.TextField(help_text="Location: GPS validation and distance between photos")
    quality_analysis_text = models.TextField(help_text="Task Quality: image quality scores and similarity percentage")
    sla_analysis_text = models.TextField(help_text="SLA Performance: met/not met and performance percentage")
    recommendations_text = models.TextField(help_text="Recommendations: suggestions based on metrics")
    
    # Metrics
    actual_duration_minutes = models.IntegerField(help_text="Actual time taken to complete task")
    sla_threshold_minutes = models.IntegerField(help_text="Expected time for task completion")
    gps_distance_meters = models.FloatField(help_text="Distance between before and after GPS locations")
    image_similarity_percentage = models.FloatField(help_text="Visual similarity score 0-100")
    before_image_quality_score = models.IntegerField(default=0)
    after_image_quality_score = models.IntegerField(default=0)
    sla_met = models.BooleanField(default=False)
    
    # Timestamps
    comparison_datetime = models.DateTimeField(auto_now_add=True, help_text="When comparison was performed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['task', 'created_at']),
            models.Index(fields=['worker', 'created_at']),
        ]
    
    def __str__(self):
        return f"Completion Report for {self.task.task_id}"
