from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer


class IsAdminOrSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'supervisor')


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'supervisor'):
            qs = Task.objects.all()
        else:
            qs = Task.objects.filter(assigned_to=user)

        status_filter = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if priority_filter:
            qs = qs.filter(priority=priority_filter)
        return qs.select_related('assigned_to', 'created_by')

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdminOrSupervisor()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
