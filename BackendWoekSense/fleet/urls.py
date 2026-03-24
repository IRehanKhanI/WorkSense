from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Minimal router setup for now
router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
