<<<<<<< HEAD
<<<<<<< HEAD
from django.urls import path

urlpatterns = [
    # Add endpoints as needed
=======
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, VehicleLocationViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'vehicle-locations', VehicleLocationViewSet, basename='vehiclelocation')

urlpatterns = [
    path('', include(router.urls)),
>>>>>>> dc4d18bafcd4ef40f049d51a2ce3d7f6304db71e
=======
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Minimal router setup for now
router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
>>>>>>> copilot/vscode-mn4q5as7-92i0
]
