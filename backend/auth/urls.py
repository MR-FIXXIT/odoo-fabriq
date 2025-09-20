from django.urls import path, include
from . import views as Login_View
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"regiter/", Login_View.UserRegisterViews, basename="register")
router.register(r"load_users/", Login_View.LoadUserView, basename="load_users")
router.register(r"logout/", Login_View.LogoutView, basename="logout")
router.register(r"token/", Login_View.CustomTokenObtainPairView, basename="token_obtain_pair")
router.register(r"token/refresh/", Login_View.CustomTokenRefreshView, basename="token_refresh")
router.register(r"token/verify/", Login_View.CustomTokenVerifyView, basename="token_verify")
router.register(r"password-reset/", Login_View.PasswordResetRequestView, basename="password_reset")
router.register(r"password-reset/confirm/", Login_View.PasswordResetConfirmView, basename="password_reset_confirm")

urlpatterns = [
    path("", include(router.urls))
]