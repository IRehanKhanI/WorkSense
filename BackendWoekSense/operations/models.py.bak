from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.utils import timezone


class Task(models.Model):
<<<<<<< HEAD
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks',
    )

    due_date = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    location_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority.upper()}] {self.title} – {self.status}"
=======
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
        return f"Verification for {self.cleaning_task.task_id} - {self.verification_status}"


class CleaningMetrics(models.Model):
    """Track metrics for cleaning verification system."""
    
    worker = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cleaning_metrics')
    
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
        from django.db.models import Q
        
        tasks = CleaningTask.objects.filter(worker=self.worker)
        verifications = VerificationResult.objects.filter(
            cleaning_task__worker=self.worker
        )
        
        self.total_tasks = tasks.count()
        self.completed_tasks = tasks.filter(status='completed').count()
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
>>>>>>> copilot/vscode-mn4q5as7-92i0
