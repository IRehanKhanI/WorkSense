from django.urls import path, include
from rest_framework.routers import DefaultRouter
<<<<<<< HEAD
from .views import TaskViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
=======
from .views import TaskViewSet, TaskProofViewSet, TaskSLAViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'proofs', TaskProofViewSet, basename='proof')
router.register(r'sla', TaskSLAViewSet, basename='sla')
>>>>>>> copilot/vscode-mn4q5as7-92i0

urlpatterns = [
    path('', include(router.urls)),
]
<<<<<<< HEAD
=======

>>>>>>> copilot/vscode-mn4q5as7-92i0
