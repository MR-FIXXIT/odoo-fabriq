from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class CustomUserManager(BaseUserManager):
    """
    Custom manager for User model.
    Handles user creation and management.
    """
    def create_superuser(self, loginid, email, password, **extra_fields):
        """
        Create and return a superuser with the given business name, email, and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(loginid, email, password, **extra_fields)
        
    def create_user(self, loginid, email, password, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        
        email = self.normalize_email(email)
        user = self.model(loginid=loginid, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

class CustomUser(AbstractBaseUser, PermissionsMixin):
    # (The rest of this model is fine as it is)
    class user_roles(models.TextChoices):
        INVENTORY_MANAGER = 'inventorymanager', _('Inventory Manager')
        MANUFACTORING_MANAGER= 'manufactoringmanager', _('Manufactoring Manager')
        OWNER = 'owner',_('Owner')
        OPERATOR = 'operator',_('Operator')
        ADMIN = 'admin', _('Admin')

    loginid = models.CharField(unique=True,primary_key=True)
    email = models.EmailField(_('email address'),unique=True)
    date_joined = models.DateField(default=timezone.now)
    password_last_changed = models.DateTimeField(default=timezone.now)
    role=models.CharField(_('role'),max_length=30,choices=user_roles.choices,)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'loginid'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.email
    
class OTP(models.Model):
    # (This model is fine as it is)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otps')
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_valid(self):
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"OTP for {self.user.email}"