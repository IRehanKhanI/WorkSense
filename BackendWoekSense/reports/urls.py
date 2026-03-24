<<<<<<< HEAD
from django.urls import path

urlpatterns = [
    # Add endpoints as needed
=======
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
>>>>>>> dc4d18bafcd4ef40f049d51a2ce3d7f6304db71e
]
