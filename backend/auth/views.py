from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status,permissions,generics
from rest_framework import permissions,status
from .models import CustomUser 
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from . import serializers as s
from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = s.CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:

            # --- NEW: Update last_login timestamp ---
            # Get the user object from the request (it's set by CustomCookieJWTAuthentication if authenticated)
            # Or, more robustly, get it from the serializer's context/validated_data
            # The serializer.user attribute holds the authenticated user after .is_valid()
            try:
                # Get the authenticated user instance directly from the serializer
                # Ensure you have 'from Login.serializers import CustomTokenObtainPairSerializer as s'
                # and that CustomTokenObtainPairSerializer has a 'user' attribute after validation.
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                user = serializer.user # This attribute is typically set by TokenObtainPairSerializer
                user.last_login = timezone.now()
                user.save(update_fields=['last_login']) # Only update the last_login field for efficiency
            except Exception as e:
                # Log this if it happens, but don't prevent token issuance
                print(f"Error updating last_login for user: {e}")
            
            
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            # Read cookie and token lifetime details from settings.SIMPLE_JWT
            access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
            refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

            # Use timezone.now() for expiry if USE_TZ = True
            # Otherwise, use datetime.utcnow()
            current_time = timezone.now() # or datetime.utcnow() if USE_TZ=False
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

            # Optionally, remove tokens from the JSON response body
            # if you *only* want them in cookies for security
            if 'access' in response.data:
                del response.data['access']
            if 'refresh' in response.data:
                del response.data['refresh']

        return response
    
class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = s.CustomTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        try:
            # Pass the request to the serializer context so it can access request.COOKIES for the refresh token
            serializer = self.get_serializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'detail': f"An error occurred during token refresh: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)

        access_token = serializer.validated_data.get('access')
        refresh_token = serializer.validated_data.get('refresh') # Will be present if ROTATE_REFRESH_TOKENS is True
        
        # Read cookie and token lifetime details from settings.SIMPLE_JWT
        access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
        refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

        current_time = timezone.now()
        access_expiry = current_time + access_lifetime

        # Set new access token cookie
        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=access_token,
            expires=access_expiry,
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path=settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
        )

        # Set new refresh token cookie if ROTATE_REFRESH_TOKENS is True
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
        # Ensure the serializer gets the request context to read cookies.
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
    def post(self,request):
        try:
            data = request.data.copy()
                # Set a default for role if not provided
            if not data.get('role'):
                data['role'] = 'user'          
            try:
                serializer = s.SignUpSerializers(data=data)
                if serializer.is_valid():
                    user = serializer.save()
                    return Response({'message': 'User created successfully', 'Name': user.name}, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)    
        except Exception as e:
            return Response({'error': 'Something went wrong when trying to register your account'+"\n"+str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
class LoadUserView(APIView):
    def get (self):
        try:
            user = CustomUser.objects.all()
            serializer = s.LoginSerializers(user)
            return Response({"data":serializer.data}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'Something went wrong when trying to load your account'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetRequestView(generics.GenericAPIView):
    """
    API endpoint to request a password reset email.
    """
    serializer_class = s.PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny] # Allow unauthenticated users to request a reset

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save() # This method sends the email if the user exists.

        # Always return a generic success message for security reasons
        return Response(
            {"detail": "If a matching account was found, a password reset email has been sent."},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(generics.GenericAPIView):
    """
    API endpoint to confirm password reset with UID and token, and set new password.
    """
    serializer_class = s.PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny] # Allow unauthenticated users to confirm reset

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save() # This method updates the user's password.

        return Response(
            {"detail": "Password has been reset successfully. You can now log in with your new password."},
            status=status.HTTP_200_OK
        )
    
class LogoutView(APIView):
    """
    API endpoint for user logout.
    Blacklists the refresh token and clears access and refresh token cookies.
    """
    permission_classes = [permissions.IsAuthenticated] # Ensures only authenticated users can hit this endpoint

    def post(self, request):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

        # 1. Get refresh token from cookie
        refresh_token_cookie_name = settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH']
        refresh_token = request.COOKIES.get(refresh_token_cookie_name)

        if refresh_token:
            try:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
                # print(f"Refresh token blacklisted for user: {request.user.email}") # Optional: For debugging
            except (InvalidToken, TokenError) as e:
                # If the token is already invalid or expired, we can just proceed with clearing cookies.
                # This can happen if the token was manually revoked or expired naturally.
                # print(f"Attempted to blacklist an invalid or expired refresh token: {e}") # Optional: For debugging
                pass # Silently proceed to clear cookies
            except Exception as e:
                # Catch any other unexpected errors during blacklisting
                # print(f"Error blacklisting refresh token: {e}") # Optional: For debugging
                # Depending on your error handling policy, you might want to log this
                pass # Silently proceed to clear cookies
        # else:
            # print("No refresh token found in cookie during logout attempt.") # Optional: For debugging


        # 2. Clear access token cookie
        access_token_cookie_name = settings.SIMPLE_JWT['AUTH_COOKIE']
        if access_token_cookie_name in request.COOKIES: # Check if the cookie exists before trying to delete
            response.delete_cookie(
                key=access_token_cookie_name,
                path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'), # Use .get() with default for robustness
                domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None)
            )

        # 3. Clear refresh token cookie
        if refresh_token_cookie_name in request.COOKIES: # Check if the cookie exists before trying to delete
            response.delete_cookie(
                key=refresh_token_cookie_name,
                path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
                domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None)
            )

        return response