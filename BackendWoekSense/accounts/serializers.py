from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
from .models import UserProfile, DeviceSession
from django.utils import timezone
from datetime import timedelta

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role', 'phone_device_id', 'is_device_registered', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_device_registered']


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration"""
    username = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True)
    phone_device_id = serializers.CharField(write_only=True, required=False, allow_blank=True, default='web_device')
    role = serializers.ChoiceField(choices=['WORKER', 'SUPERVISOR', 'ADMIN'], default='WORKER')
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    user = UserSerializer(read_only=True)
    profile = UserProfileSerializer(read_only=True)
    token = serializers.CharField(read_only=True)
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value
    
    def validate_phone_device_id(self, value):
        if value and value != 'web_device' and UserProfile.objects.filter(phone_device_id=value).exists():
            raise serializers.ValidationError("Device already registered to another user.")
        return value
    
    def create(self, validated_data):
        # Extract serialized fields
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        phone_device_id = validated_data.pop('phone_device_id', 'web_device')
        role = validated_data.pop('role', 'WORKER')
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create profile
        profile = UserProfile.objects.create(
            user=user,
            phone_device_id=phone_device_id,
            role=role,
            is_device_registered=True
        )
        
        # Generate token (use DRF's Token)
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        
        # Create device session
        expires_at = timezone.now() + timedelta(days=30)
        DeviceSession.objects.create(
            user_profile=profile,
            device_id=phone_device_id,
            token=token.key,
            expires_at=expires_at
        )
        
        return {
            'user': user,
            'profile': profile,
            'token': token.key
        }


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    phone_device_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    user = UserSerializer(read_only=True)
    profile = UserProfileSerializer(read_only=True)
    token = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    
    def validate(self, data):
        from django.contrib.auth import authenticate
        
        username = data.get('username')
        password = data.get('password')
        phone_device_id = data.get('phone_device_id')
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid username/password.")
        
        # Get profile
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("User profile not found.")
        
        # Validate device is ignored since requirements are removed
        # if profile.phone_device_id != phone_device_id:
        #     raise serializers.ValidationError("Device not registered for this user.")
        
        data['user'] = user
        data['profile'] = profile
        return data
    
    def create(self, validated_data):
        user = validated_data['user']
        profile = validated_data['profile']
        phone_device_id = validated_data.get('phone_device_id', profile.phone_device_id)
        
        # Get or create token
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        
        # Check for existing active session
        active_sessions = profile.device_sessions.filter(
            status='ACTIVE',
            expires_at__gt=timezone.now()
        )
        
        # Revoke old sessions from different devices
        for session in active_sessions:
            if session.device_id != phone_device_id:
                session.status = 'REVOKED'
                session.save()
        
        # Get or create current session
        expires_at = timezone.now() + timedelta(days=30)
        session, created = DeviceSession.objects.get_or_create(
            user_profile=profile,
            device_id=phone_device_id,
            defaults={
                'token': token.key,
                'expires_at': expires_at,
                'status': 'ACTIVE'
            }
        )
        
        if not created:
            session.token = token.key
            session.expires_at = expires_at
            session.status = 'ACTIVE'
            session.login_timestamp = timezone.now()
            session.save()
        
        message = "Successfully logged in. Only one device can be logged in at a time."
        
        return {
            'user': user,
            'profile': profile,
            'token': token.key,
            'message': message
        }


class DeviceRegistrationSerializer(serializers.Serializer):
    """Verify device registration"""
    phone_device_id = serializers.CharField()
    username = serializers.CharField()
    
    is_registered = serializers.BooleanField(read_only=True)
    message = serializers.CharField(read_only=True)
    
    def validate(self, data):
        username = data.get('username')
        phone_device_id = data.get('phone_device_id')
        
        try:
            user = User.objects.get(username=username)
            profile = UserProfile.objects.get(user=user)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            raise serializers.ValidationError("User not found.")
        
        data['user'] = user
        data['profile'] = profile
        return data
    
    def create(self, validated_data):
        profile = validated_data['profile']
        phone_device_id = validated_data['phone_device_id']
        
        is_registered = profile.phone_device_id == phone_device_id
        message = "Device is registered." if is_registered else "Device is not registered."
        
        return {
            'is_registered': is_registered,
            'message': message
        }
