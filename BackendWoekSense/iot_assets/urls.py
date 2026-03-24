from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IoTDeviceViewSet, SensorReadingViewSet

router = DefaultRouter()
router.register(r'iot-devices', IoTDeviceViewSet, basename='iotdevice')
router.register(r'sensor-readings', SensorReadingViewSet, basename='sensorreading')

urlpatterns = [
    path('', include(router.urls)),
]
