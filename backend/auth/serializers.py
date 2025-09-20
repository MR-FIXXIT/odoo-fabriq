from rest_framework import serializers
from .models import CustomUser
from django.conf import settings
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer,TokenRefreshSerializer,TokenVerifySerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from django.core.exceptions import ValidationError
from .email import send_templated_email  # Assuming you have a utility function for sending emails
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken,BlacklistedToken
from django.utils import timezone

User = get_user_model() # Get your CustomUser model

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims if needed
        return token
    
class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'COOKIES'):
            # Read cookie name from settings
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
            if refresh_token:
                attrs['refresh'] = refresh_token
            else:
                # If refresh token is not in cookie, check body (for compatibility or other clients)
                if 'refresh' not in attrs:
                    raise InvalidToken("No refresh token found in cookies or request body.")

        return super().validate(attrs)
    
class CustomTokenVerifySerializer(TokenVerifySerializer):
    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'COOKIES'):
            # Read cookie name from settings
            access_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
            if access_token:
                attrs['token'] = access_token
            else:
                # Fallback to body or raise error if token not found anywhere
                if 'token' not in attrs:
                    raise InvalidToken("No token found in cookies or request body for verification.")

        return super().validate(attrs)

class SignUpSerializers(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True) # Ensure email is required if your model allows blank=True

    class Meta:
        model = CustomUser
        # Explicitly list the fields a user can provide during signup
        fields = ('loginid', 'email', 'password', 'password2', 'role')
        # Any fields that should not be set by the user during creation
        read_only_fields = ( 'is_staff', 'is_superuser', 'is_active', 'start_date', 'last_login')


    def validate(self, data):
        # 1. Validate password match
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords must match."})

        # Optional: Add password complexity validation if not handled by Django's auth validators
        # You might need to import 'password_validation' from django.contrib.auth
        # from django.contrib.auth import password_validation
        # try:
        #     password_validation.validate_password(data['password'], user=CustomUser())
        # except ValidationError as e:
        #     raise serializers.ValidationError({"password": list(e.messages)})

        return data

    def create(self, validated_data):
        # Pop password2 as it's only for validation, not for user creation
        validated_data.pop('password2')
        password = validated_data.pop('password') # Get the plain text password

        try:
            # Create the user instance. It's best practice to use create_user if available
            # on your CustomUser model's manager, as it handles password hashing.
            user = CustomUser.objects.create_user(
                email=validated_data['email'],
                loginid=validated_data['loginid'],
                password=password, # Pass the plain text password here for hashing
                role=validated_data.get('role', ''),
                # Add other fields you want to set during creation from validated_data
            )

            # If you have a 'role' field and want to set a default for new users, do it here:
            # user.role = 'regular_user'
            # user.save() # Save again if you changed fields after create_user

        except Exception as e:
            # Catch potential database errors (e.g., duplicate unique fields like email or user_name)
            raise serializers.ValidationError({"detail": f"Could not create user: {e}"})

        # --- Prepare and send Welcome Email using the unified function ---
        subject = f"Welcome to {settings.SITE_NAME}!"
        recipient_list = [user.email]
        context = {
            'user': user,
            'site_name': settings.SITE_NAME,
            #'site_domain': settings.SITE_DOMAIN,
            'role': user.role,
        }

        # Option 1: Synchronous call
        send_templated_email(
            subject,
            'emails/welcome_email.txt',
            'emails/welcome_email.html',
            recipient_list,
            context
        )

        # Option 2: Asynchronous call (if send_templated_email_async is defined in email_utils.py)
        # send_templated_email_async.delay(
        #     subject,
        #     'emails/welcome_email.txt',
        #     'emails/welcome_email.html',
        #     recipient_list,
        #     context
        # )

        return user
    
class LoginSerializers(serializers.Serializer):
    class Meta:
        model = CustomUser
        fields = '__all__'  # This will include all fields, but you might want to limit it to specific fields like 'email' and 'password'

class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for the password reset request.
    Takes an email and sends a password reset link.
    """
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email address is required.',
            'invalid': 'Please enter a valid email address.'
        }
    )

    def validate_email(self, value):
        # We don't raise User.DoesNotExist here for security reasons,
        # to prevent email enumeration attacks.
        try:
            self.user = User.objects.get(email__iexact=value) # Use iexact for case-insensitive match
        except User.DoesNotExist:
            self.user = None # User not found, but we proceed to send a generic success
        return value

    def save(self):
        # Only send email if user exists. If not, just return as if it was sent
        # for security reasons (don't confirm if an email exists).
        if self.user:
            user = self.user
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # --- Prepare and send Password Reset Email using the unified function ---
            subject = "Password Reset Request for Your Account"
            recipient_list = [user.email]
            # Construct the reset URL for the frontend 
            reset_url = f"{settings.FRONTEND_PASSWORD_RESET_URL}{uid}/{token}/"
            context = {
                'user': user,
                'email': user.email, # Can be removed if not explicitly used in template
                'reset_url': reset_url,
                #'domain': settings.SITE_DOMAIN, # Optional, if not used in template
                'site_name': settings.SITE_NAME,
            }

            # Option 1: Synchronous call
            send_templated_email(
                subject,
                'emails/password_reset_email.txt',
                'emails/password_reset_email.html',
                recipient_list,
                context
            )

            # Option 2: Asynchronous call (if send_templated_email_async is defined)
            # send_templated_email_async.delay(
            #     subject,
            #     'emails/password_reset_email.txt',
            #     'emails/password_reset_email.html',
            #     recipient_list,
            #     context
            # )
        else:
            print(f"No user found for email: {self.validated_data['email']}. Not sending email.")

class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming password reset with uid, token, and new password.
    """
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'},
        error_messages={
            'required': 'New password is required.',
            'min_length': 'New password must be at least 8 characters long.'
        }
    )
    re_new_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        error_messages={
            'required': 'Confirm new password is required.'
        }
    )
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)

    def validate(self, data):
        # 1. Check if passwords match
        if data['new_password'] != data['re_new_password']:
            raise serializers.ValidationError({"re_new_password": "New passwords must match."})

        # 2. Decode UID and retrieve user
        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            self.user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uid": "Invalid user ID."})

        # 3. Validate the token
        if not default_token_generator.check_token(self.user, data['token']):
            raise serializers.ValidationError({"token": "Invalid or expired reset token."})

        # 4. Validate password strength
        try:
            # Pass the user instance for better password validation (e.g., preventing reuse of old passwords)
            password_validation.validate_password(data['new_password'], user=self.user)
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        return data
    
    #previously used save function before blacklisting tokens
    """
    def save(self):
        user = self.user
        user.set_password(self.validated_data['new_password'])
        user.save()
        # The token is effectively consumed by check_token and password change.
        # No explicit invalidation needed for default_token_generator.
        # If you were managing refresh tokens, you might want to blacklist them here.

    """
    
    def save(self):
        user = self.user
        user.set_password(self.validated_data['new_password'])
        user.password_last_changed = timezone.now()  # Update the password last changed timestamp
        user.save()

        # --- NEW: Blacklist all outstanding tokens for this user ---
        try:
            # Find all outstanding (refresh) tokens belonging to this user
            outstanding_tokens = OutstandingToken.objects.filter(user=user)

            # Blacklist each outstanding token
            for token in outstanding_tokens:
                # We need to create a RefreshToken object from the raw token value
                # to call the .blacklist() method provided by simplejwt's mixin.
                try:
                    refresh_token_instance = RefreshToken(str(token.token)) # Convert UUID to string if necessary
                    refresh_token_instance.blacklist()
                    # print(f"Blacklisted refresh token {token.token} for user {user.email} after password reset.") # Optional: for debugging
                except (InvalidToken, TokenError) as e:
                    # Log if a token is already invalid, but don't stop the process
                    # print(f"Skipping invalid/expired outstanding token {token.token} during password reset blacklist: {e}")
                    pass
                except Exception as e:
                    # Catch any other unexpected errors during blacklisting
                    # print(f"Error blacklisting outstanding token {token.token} for user {user.email}: {e}")
                    pass

        except Exception as e:
            # Catch errors in the blacklisting process itself
            # print(f"An error occurred while blacklisting tokens during password reset for user {user.email}: {e}")
            pass # Do not prevent password reset from completing if token blacklisting fails


        # The token is effectively consumed by check_token and password change.
        # No explicit invalidation needed for default_token_generator.
        # If you were managing refresh tokens, you might want to blacklist them here.