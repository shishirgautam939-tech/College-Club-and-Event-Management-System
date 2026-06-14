from django.contrib import admin
from .models import Event, EventApproval


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'organizer_type', 'status', 'event_date', 'created_by')
    list_filter = ('status', 'organizer_type')
    search_fields = ('title', 'description')
    ordering = ('-event_date',)


@admin.register(EventApproval)
class EventApprovalAdmin(admin.ModelAdmin):
    list_display = ('event', 'decision', 'approved_by', 'approved_at')
    list_filter = ('decision',)
    search_fields = ('event__title', 'remarks')
