# In auth/views.py
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, permissions, generics
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from . import serializers as s
from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
import random
from datetime import timedelta
from .models import CustomUser, OTP
from .email import send_templated_email

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = s.CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
            refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
            current_time = timezone.now()
            access_expiry = current_time + access_lifetime
            refresh_expiry = current_time + refresh_lifetime

            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                expires=access_expiry,
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
            )
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=refresh_token,
                expires=refresh_expiry,
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
            )
            
            if 'access' in response.data:
                del response.data['access']
            if 'refresh' in response.data:
                del response.data['refresh']

        return response
    
class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = s.CustomTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'detail': f"An error occurred during token refresh: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        access_token = serializer.validated_data.get('access')
        refresh_token = serializer.validated_data.get('refresh')
        access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
        refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
        current_time = timezone.now()
        access_expiry = current_time + access_lifetime

        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=access_token,
            expires=access_expiry,
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
        )

        if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS') and refresh_token:
            refresh_expiry = current_time + refresh_lifetime
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=refresh_token,
                expires=refresh_expiry,
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
            )
            if 'refresh' in response.data:
                del response.data['refresh']

        if 'access' in response.data:
            del response.data['access']
        return response

class CustomTokenVerifyView(TokenVerifyView):
    serializer_class = s.CustomTokenVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'detail': f"An error occurred during token verification: {e}"}, status=status.HTTP_400_BAD_REQUEST)

class UserRegisterViews(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        data = request.data.copy()
        if not data.get('role'):
            data['role'] = 'owner'
        
        serializer = s.SignUpSerializers(data=data)
        
        if serializer.is_valid(raise_exception=True):
            user = serializer.save()
            return Response({'message': 'User created successfully', 'loginid': user.loginid}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoadUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = s.SignUpSerializers(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class OTPRequestView(generics.GenericAPIView):
    serializer_class = s.PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.user
        
        OTP.objects.filter(user=user).delete()
        
        otp_code = str(random.randint(100000, 999999))
        
        OTP.objects.create(
            user=user,
            otp_code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        subject = "Password Reset OTP"
        context = {
            'user': user,
            'otp': otp_code,
            'site_name': settings.SITE_NAME,
        }
        send_templated_email(
            subject,
            'emails/password_reset_otp.txt',
            'emails/password_reset_otp.html',
            [user.email],
            context
        )

        return Response(
            {"detail": "If a matching account was found, an OTP has been sent."},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = s.PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        otp_code = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        otp_instance = OTP.objects.filter(user=user, otp_code=otp_code).first()
        if not otp_instance or not otp_instance.is_valid():
            return Response(
                {"detail": "Invalid or expired OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.password_last_changed = timezone.now()
        user.save()

        otp_instance.delete()
        
        try:
            outstanding_tokens = RefreshToken.objects.filter(user=user)
            for token in outstanding_tokens:
                token.blacklist()
        except Exception:
            pass

        return Response(
            {"detail": "Password has been reset successfully. You can now log in with your new password."},
            status=status.HTTP_200_OK
        )
    
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        refresh_token_cookie_name = settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH']
        refresh_token = request.COOKIES.get(refresh_token_cookie_name)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (InvalidToken, TokenError):
                pass
            except Exception:
                pass

        access_token_cookie_name = settings.SIMPLE_JWT['AUTH_COOKIE']
        if access_token_cookie_name in request.COOKIES:
            response.delete_cookie(
                key=access_token_cookie_name,
                path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
                domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None)
            )

        if refresh_token_cookie_name in request.COOKIES:
            response.delete_cookie(
                key=refresh_token_cookie_name,
                path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
                domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None)
            )
        return response