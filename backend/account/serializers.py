# In auth/serializers.py
from rest_framework import serializers
from .models import CustomUser, OTP
from django.conf import settings
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer, TokenVerifySerializer
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from .email import send_templated_email
from django.utils import timezone
from rest_framework.exceptions import ValidationError

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token
    
class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'COOKIES'):
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
            if refresh_token:
                attrs['refresh'] = refresh_token
        return super().validate(attrs)
    
class CustomTokenVerifySerializer(TokenVerifySerializer):
    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'COOKIES'):
            access_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
            if access_token:
                attrs['token'] = access_token
        return super().validate(attrs)

class SignUpSerializers(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)

    class Meta:
        model = CustomUser
        fields = ('loginid', 'email', 'password', 'password2', 'role')
        read_only_fields = ('is_staff', 'is_superuser', 'is_active', 'date_joined', 'last_login')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords must match."})
        
        try:
            password_validation.validate_password(data['password'], user=CustomUser())
        except DjangoValidationError as e:
            raise ValidationError({"password": list(e.messages)})
        
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        role = validated_data.get('role', 'owner')
        valid_roles = [choice[0] for choice in CustomUser.user_roles.choices]
        if role not in valid_roles:
            raise ValidationError({"role": f"Invalid role provided. Choose from: {', '.join(valid_roles)}"})
        
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            loginid=validated_data['loginid'],
            password=password,
            role=role,
        )
        
        subject = f"Welcome to {settings.SITE_NAME}!"
        recipient_list = [user.email]
        context = {
            'user': user,
            'site_name': settings.SITE_NAME,
            'role': user.role,
        }
        send_templated_email(subject, 'emails/welcome_email.txt', 'emails/welcome_email.html', recipient_list, context)
        return user

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = CustomUser.objects.get(email__iexact=value)
        except CustomUser.DoesNotExist:
            self.user = None
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8, style={'input_type': 'password'})
    re_new_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, data):
        if data['new_password'] != data['re_new_password']:
            raise serializers.ValidationError({"re_new_password": "New passwords must match."})
        
        try:
            user = CustomUser.objects.get(email__iexact=data['email'])
            data['user'] = user
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email not found."})

        try:
            password_validation.validate_password(data['new_password'], user=user)
        except DjangoValidationError as e:
            raise ValidationError({"new_password": list(e.messages)})
        
        return data