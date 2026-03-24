from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaskViewSet, TaskProofViewSet, TaskSLAViewSet,
    upload_before_image, upload_after_image_and_verify,
    get_task_details, get_worker_tasks, get_worker_metrics,
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'proofs', TaskProofViewSet, basename='proof')
router.register(r'sla', TaskSLAViewSet, basename='sla')

urlpatterns = [
    path('', include(router.urls)),

    # Cleaning task verification endpoints
    path('upload-before/', upload_before_image, name='upload-before'),
    path('upload-after-verify/', upload_after_image_and_verify, name='upload-after-verify'),
    path('task/<str:task_id>/', get_task_details, name='task-detail'),
    path('my-tasks/', get_worker_tasks, name='my-tasks'),
    path('my-metrics/', get_worker_metrics, name='my-metrics'),
]

