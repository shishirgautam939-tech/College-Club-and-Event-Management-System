from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Handles password hashing automatically
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'Admin')
        extra_fields.setdefault('full_name', extra_fields.get('full_name', 'Site Admin'))
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # Standard 'id' field is created automatically by Django (Integer PK)

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)

    # User Types
    TYPE_CHOICES = (
        ('Student', 'Student'),
        ('Faculty', 'Faculty'),
        ('Staff', 'Staff'),
        ('Admin', 'Admin'),
    )
    user_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    # Department (for faculty)
    department = models.ForeignKey(
        'clubs.Department', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='users',
        help_text='Department the faculty belongs to'
    )

    # Branch (for students)
    BRANCH_CHOICES = (
        ('BCT', 'BCT - Computer'),
        ('BCE', 'BCE - Civil'),
        ('BEE', 'BEE - Electrical'),
        ('BEI', 'BEI - Electronics'),
    )
    branch = models.CharField(
        max_length=3, choices=BRANCH_CHOICES,
        blank=True, null=True,
        help_text='Engineering branch for students'
    )

    # Specific to Students
    roll_number = models.CharField(
        max_length=12, 
        blank=True, 
        null=True, 
        unique=True,
        help_text="Format: NCE0XXBRANCH0XX (e.g. NCE078BCT012)"
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Required for Admin access
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'user_type']

    def __str__(self):
        return self.email

# If you want Roles separate from User Type


class Role(models.Model):
    role_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.role_name


class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_users')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.email} - {self.role.role_name}"
