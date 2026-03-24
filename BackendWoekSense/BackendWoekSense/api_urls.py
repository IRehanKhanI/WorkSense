"""
API URL configuration for WorkSense v1
"""
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    # Authentication
    path('auth/token/', obtain_auth_token, name='api_token_auth'),
    
    # App routes
    path('accounts/', include('accounts.urls')),
    path('attendance/', include('attendance.urls')),
    path('operations/', include('operations.urls')),
    path('fleet/', include('fleet.urls')),
    path('iot/', include('iot_assets.urls')),
    path('reports/', include('reports.urls')),
]
