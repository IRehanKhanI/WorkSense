from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')

from .views import WorkZoneViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'zones', WorkZoneViewSet, basename='workzone')
router.register(r'', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]
