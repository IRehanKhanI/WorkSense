from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

from .views import TaskViewSet, TaskProofViewSet, TaskSLAViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'proofs', TaskProofViewSet, basename='proof')
router.register(r'sla', TaskSLAViewSet, basename='sla')

urlpatterns = [
    path('', include(router.urls)),
]


