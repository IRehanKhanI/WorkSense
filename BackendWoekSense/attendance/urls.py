from django.urls import path, include
from rest_framework.routers import DefaultRouter
<<<<<<< HEAD
from .views import AttendanceViewSet

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')
=======
from .views import WorkZoneViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'zones', WorkZoneViewSet, basename='workzone')
router.register(r'', AttendanceViewSet, basename='attendance')
>>>>>>> copilot/vscode-mn4q5as7-92i0

urlpatterns = [
    path('', include(router.urls)),
]
