from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Report
        fields = [
            'id', 'title', 'report_type', 'format',
            'generated_by', 'generated_by_name',
            'parameters', 'file_url', 'generated_at',
        ]
        read_only_fields = ['id', 'generated_at', 'generated_by']
