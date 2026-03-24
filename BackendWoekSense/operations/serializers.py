from rest_framework import serializers
from .models import Task, TaskProof, TaskSLA


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


from .models import VerificationResult

class VerificationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationResult
        fields = '__all__'
