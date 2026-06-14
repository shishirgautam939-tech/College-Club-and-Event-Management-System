from django.contrib import admin
from .models import Department, Club, ClubMember


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'department_name', 'hod')
    search_fields = ('department_name',)


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ('id', 'club_name', 'faculty_coordinator', 'is_council')
    list_filter = ('is_council',)
    search_fields = ('club_name',)


@admin.register(ClubMember)
class ClubMemberAdmin(admin.ModelAdmin):
    list_display = ('club', 'user', 'position', 'joined_at')
    list_filter = ('position', 'club')
    search_fields = ('user__full_name', 'club__club_name')
