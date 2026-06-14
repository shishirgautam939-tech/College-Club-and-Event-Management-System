from django.contrib import admin
from .models import User, Role, UserRole


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'email', 'user_type', 'roll_number', 'is_active', 'is_staff')
    list_filter = ('user_type', 'is_active')
    search_fields = ('full_name', 'email', 'roll_number')
    ordering = ('-created_at',)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'role_name')
    search_fields = ('role_name',)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'assigned_at')
    list_filter = ('role',)
    search_fields = ('user__email', 'role__role_name')