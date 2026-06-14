from django.contrib import admin
from .models import EventRegistration, Attendance


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'registered_at')
    list_filter = ('event',)
    search_fields = ('user__full_name', 'event__title')
    ordering = ('-registered_at',)  # Most recent registrations first


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'present', 'marked_at')
    list_filter = ('present', 'event')  # Filter by attendance status
    search_fields = ('user__full_name', 'event__title')
