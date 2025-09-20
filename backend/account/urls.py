# In auth/urls.py
from django.urls import path, include
from . import views as auth_views

urlpatterns = [
    path('register/', auth_views.UserRegisterViews.as_view(), name='register'),
    path('users/', auth_views.LoadUserView.as_view(), name='load_users'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('token/', auth_views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', auth_views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', auth_views.CustomTokenVerifyView.as_view(), name='token_verify'),
    path('otp-request/', auth_views.OTPRequestView.as_view(), name='otp_request'),
    path('password-reset/confirm/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]