from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.contrib.auth import get_user_model
User = get_user_model()

from .models import UserProfile, DeviceSession
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    DeviceRegistrationSerializer
)


class AuthViewSet(viewsets.ViewSet):
    """API endpoints for authentication"""
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user with device fingerprinting"""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'user': {
                    'id': data['user'].id,
                    'username': data['user'].username,
                    'email': data['user'].email
                },
                'profile': UserProfileSerializer(data['profile']).data,
                'token': data['token']
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login user and return token"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.save()
            return Response({
                'message': data['message'],
                'user': {
                    'id': data['user'].id,
                    'username': data['user'].username,
                    'email': data['user'].email
                },
                'profile': UserProfileSerializer(data['profile']).data,
                'token': data['token']
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user and revoke token"""
        try:
            token = Token.objects.get(user=request.user)
            profile = UserProfile.objects.get(user=request.user)
            
            # Revoke current session
            phone_device_id = request.data.get('phone_device_id')
            if phone_device_id:
                session = DeviceSession.objects.filter(
                    user_profile=profile,
                    device_id=phone_device_id
                ).first()
                if session:
                    session.status = 'REVOKED'
                    session.save()
            
            # Delete token
            token.delete()
            
            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current authenticated user's profile"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response({
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'email': request.user.email,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name
                },
                'profile': serializer.data
            }, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'User profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_device(self, request):
        """Verify if a device is registered"""
        serializer = DeviceRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.save()
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def sessions(self, request):
        """Get all active device sessions for current user"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            sessions = profile.device_sessions.filter(
                status='ACTIVE',
                expires_at__gt=timezone.now()
            ).values('id', 'device_id', 'login_timestamp', 'last_activity')
            return Response({
                'count': len(list(sessions)),
                'sessions': list(sessions)
            }, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'User profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

