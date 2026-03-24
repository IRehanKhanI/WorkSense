from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/live-tracking/', consumers.LiveTrackingConsumer.as_asgi()),
]