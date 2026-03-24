from rest_framework import serializers
from .models import Task, TaskProof, TaskSLA, CleaningTask, VerificationResult


class TaskProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskProof
        fields = ['id', 'proof_type', 'image', 'gps_lat', 'gps_lon', 'submitted_at', 'watermark_text']
        read_only_fields = ['id', 'submitted_at']


class TaskSLASerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSLA
        fields = [
            'id',
            'task',
            'before_photo_time',
            'after_photo_time',
            'duration_minutes',
            'sla_threshold_minutes',
            'sla_met',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'duration_minutes', 'sla_met', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True, allow_null=True)
    proofs = TaskProofSerializer(many=True, read_only=True)
    sla = TaskSLASerializer(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id',
            'task_id',
            'assigned_to',
            'assigned_to_username',
            'assigned_by',
            'assigned_by_username',
            'task_type',
            'description',
            'assigned_date',
            'status',
            'proofs',
            'sla',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskProofUploadSerializer(serializers.Serializer):
    """Serializer for uploading proof images"""
    image = serializers.ImageField()
    gps_lat = serializers.FloatField()
    gps_lon = serializers.FloatField()
    proof_type = serializers.ChoiceField(choices=['BEFORE', 'AFTER'])
    task_id = serializers.CharField()
    
    def validate_task_id(self, value):
        try:
            Task.objects.get(task_id=value)
        except Task.DoesNotExist:
            raise serializers.ValidationError("Task not found.")
        return value


class VerificationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationResult
        fields = [
            'id',
            'before_prediction',
            'before_confidence',
            'before_class_scores',
            'after_prediction',
            'after_confidence',
            'after_class_scores',
            'cleanup_successful',
            'cleanup_confidence',
            'verification_status',
            'recommendation_message',
            'model_version',
            'confidence_threshold',
            'verified_at',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CleaningTaskSerializer(serializers.ModelSerializer):
    worker_username = serializers.CharField(source='worker.username', read_only=True)
    verification = VerificationResultSerializer(read_only=True)

    class Meta:
        model = CleaningTask
        fields = [
            'id',
            'task_id',
            'worker',
            'worker_username',
            'location',
            'description',
            'status',
            'before_image',
            'after_image',
            'assigned_date',
            'completion_date',
            'verification',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'worker', 'created_at', 'updated_at']

