from django.urls import path, include
from rest_framework.routers import DefaultRouter
<<<<<<< HEAD
from rest_framework_simplejwt.views import TokenRefreshView

from .views import UserViewSet, WorkSenseTokenView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('auth/login/', WorkSenseTokenView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
=======
from .views import AuthViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')

urlpatterns = [
>>>>>>> copilot/vscode-mn4q5as7-92i0
    path('', include(router.urls)),
]
