from django.contrib import admin
from .models import CustomUser
from django.contrib.auth.admin import UserAdmin
from django.forms import EmailInput

class CustomUserAdminConfig(UserAdmin):
    model = CustomUser
    search_fields = ('email', 'loginid'
    '')
    list_filter = ('is_active', 'is_staff', 'date_joined', 'role')
    ordering = ('role','-date_joined',)
    list_display = ('first_name','email','role', 'date_joined', 'is_active', 'is_staff')

    fieldsets = (
        (None, {'fields': ( 'loginid','email', 'password',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'role','is_superuser',)}),
        ('Important dates', {'fields': ('date_joined','last_login','password_last_changed',)}),
        ('Group Permissions', {'fields': ('groups', 'user_permissions',)}),
    )

    formfield_overrides = {
        model.email: {'widget': EmailInput(attrs={'placeholder': 'user@example.com'})},
        
    }
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('loginid','email', 'password1', 'password2','is_staff',)}
        ),
    )
    readonly_fields = ('last_login', 'date_joined','role','is_superuser','password_last_changed',)

    def save_model(self, request, obj, form, change):
        """
        Set the default role to 'user' for new user creations.
        The 'change' parameter is False if a new object is being created.
        """
        if not change:
            obj.role = 'user'
        super().save_model(request, obj, form, change)

# Register your models here.
admin.site.register(CustomUser, CustomUserAdminConfig)