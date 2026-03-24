from django.contrib import admin
from .models import Task, TaskProof, TaskSLA


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['task_id', 'assigned_to', 'task_type', 'status', 'assigned_date']
    list_filter = ['status', 'task_type', 'assigned_date']
    search_fields = ['task_id', 'assigned_to__username', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'assigned_date'
    
    fieldsets = (
        ('Task Details', {'fields': ('task_id', 'task_type', 'description')}),
        ('Assignment', {'fields': ('assigned_to', 'assigned_by', 'assigned_date')}),
        ('Status', {'fields': ('status',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(TaskProof)
class TaskProofAdmin(admin.ModelAdmin):
    list_display = ['task', 'proof_type', 'gps_lat', 'gps_lon', 'submitted_at']
    list_filter = ['proof_type', 'submitted_at']
    search_fields = ['task__task_id']
    readonly_fields = ['submitted_at', 'created_at', 'watermark_text']
    
    fieldsets = (
        ('Task', {'fields': ('task',)}),
        ('Proof', {'fields': ('proof_type', 'image', 'watermark_text')}),
        ('Location', {'fields': ('gps_lat', 'gps_lon')}),
        ('Timestamps', {'fields': ('submitted_at', 'created_at'), 'classes': ('collapse',)}),
    )


@admin.register(TaskSLA)
class TaskSLAAdmin(admin.ModelAdmin):
    list_display = ['task', 'duration_minutes', 'sla_met', 'created_at']
    list_filter = ['sla_met', 'created_at']
    search_fields = ['task__task_id']
    readonly_fields = ['duration_minutes', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Task', {'fields': ('task',)}),
        ('Timeline', {'fields': ('before_photo_time', 'after_photo_time', 'duration_minutes')}),
        ('SLA', {'fields': ('sla_threshold_minutes', 'sla_met')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

        ('Results', {
            'fields': ('recommendation_message', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CleaningMetrics)
class CleaningMetricsAdmin(admin.ModelAdmin):
    list_display = ['worker', 'total_tasks', 'completed_tasks', 'verified_clean', 'success_rate', 'average_confidence']
    list_filter = ['updated_at']
    search_fields = ['worker__username', 'worker__first_name', 'worker__last_name']
    readonly_fields = ['updated_at']
    
    fieldsets = (
        ('Worker', {
            'fields': ('worker',)
        }),
        ('Task Statistics', {
            'fields': ('total_tasks', 'completed_tasks')
        }),
        ('Verification Results', {
            'fields': ('verified_clean', 'verification_failed')
        }),
        ('Performance Metrics', {
            'fields': ('success_rate', 'average_confidence')
        }),
        ('Tracking', {
            'fields': ('last_task_date', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
