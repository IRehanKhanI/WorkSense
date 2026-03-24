from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'priority', 'status', 'assigned_to', 'due_date', 'created_at']
    list_filter = ['status', 'priority']
    search_fields = ['title', 'assigned_to__username']
    ordering = ['-created_at']
