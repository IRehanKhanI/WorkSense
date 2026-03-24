from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, VehicleLocationViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'vehicle-locations', VehicleLocationViewSet, basename='vehiclelocation')

urlpatterns = [
    path('', include(router.urls)),
]
