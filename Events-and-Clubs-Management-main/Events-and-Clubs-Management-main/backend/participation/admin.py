from django.contrib import admin
from .models import EventRegistration, Attendance, Certificate


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'registered_at')
    list_filter = ('event',)
    search_fields = ('user__full_name', 'event__title')
    ordering = ('-registered_at',)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'present', 'marked_via_qr', 'marked_at')
    list_filter = ('present', 'marked_via_qr', 'event')
    search_fields = ('user__full_name', 'event__title')


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'certificate_code', 'issued_at')
    search_fields = ('user__full_name', 'event__title', 'certificate_code')
