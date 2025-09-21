from django.contrib import admin
from .models import CustomUser, OTP
from django.contrib.auth.admin import UserAdmin
from django.forms import EmailInput
from django.db.models import EmailField

# Register the OTP model
@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ('user', 'otp_code', 'created_at', 'expires_at', 'is_valid')
    search_fields = ('user__email',)
    list_filter = ('created_at', 'expires_at')
    readonly_fields = ('created_at',)


class CustomUserAdminConfig(UserAdmin):
    model = CustomUser
    search_fields = ('email', 'loginid')
    list_filter = ('is_active', 'is_staff', 'date_joined', 'role')
    ordering = ('role', '-date_joined',)
    list_display = ('loginid', 'email', 'role', 'date_joined', 'is_active', 'is_staff')

    fieldsets = (
        (None, {'fields': ('loginid', 'email', 'password',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'role', 'is_superuser',)}),
        ('Important dates', {'fields': ('date_joined', 'last_login', 'password_last_changed',)}),
        ('Group Permissions', {'fields': ('groups', 'user_permissions',)}),
    )

    formfield_overrides = {
        EmailField: {'widget': EmailInput(attrs={'placeholder': 'user@example.com'})},
    }
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('loginid', 'email', 'password',)}
        ),
    )
    readonly_fields = ('date_joined', 'password_last_changed',)

# Register your models here.
admin.site.register(CustomUser, CustomUserAdminConfig)