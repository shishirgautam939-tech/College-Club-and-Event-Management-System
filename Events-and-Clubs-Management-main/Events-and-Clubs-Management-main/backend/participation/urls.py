from django.urls import path
from .views import (
    RegisterForEventView,
    UnregisterFromEventView,
    MyRegistrationsView,
    EventParticipantsView,
    EventAttendanceView,
    MarkAttendanceView,
    MyAttendanceView,
)

app_name = 'participation'

urlpatterns = [
    # Student registration
    path('events/<int:event_id>/register/', RegisterForEventView.as_view(), name='register_event'),
    path('events/<int:event_id>/unregister/', UnregisterFromEventView.as_view(), name='unregister_event'),

    # Student's own registrations & attendance
    path('my/registrations/', MyRegistrationsView.as_view(), name='my_registrations'),
    path('my/attendance/', MyAttendanceView.as_view(), name='my_attendance'),

    # Admin/Faculty: event participants & attendance management
    path('events/<int:event_id>/participants/', EventParticipantsView.as_view(), name='event_participants'),
    path('events/<int:event_id>/attendance/', EventAttendanceView.as_view(), name='event_attendance'),
    path('events/<int:event_id>/attendance/mark/', MarkAttendanceView.as_view(), name='mark_attendance'),
]
