from rest_framework import viewsets, permissions
from .models import Report
from .serializers import ReportSerializer


class IsAdminOrSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'supervisor')


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAdminOrSupervisor]

    def get_queryset(self):
        return Report.objects.all().select_related('generated_by')

    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)
