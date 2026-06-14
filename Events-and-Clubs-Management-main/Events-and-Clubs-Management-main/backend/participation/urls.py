from django.urls import path
from .views import (
    RegisterForEventView,
    UnregisterFromEventView,
    MyRegistrationsView,
    EventParticipantsView,
    EventAttendanceView,
    MarkAttendanceView,
    MyAttendanceView,
    EventQRAttendanceView,
    VerifyQRAttendanceView,
    MyCertificatesView,
    EventCertificatesView,
    DownloadCertificateView,
    DownloadMyEventCertificateView,
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
    path('events/<int:event_id>/attendance/qr/', EventQRAttendanceView.as_view(), name='event_qr_attendance'),
    path('attendance/verify-qr/', VerifyQRAttendanceView.as_view(), name='verify_qr_attendance'),

    # Certificates
    path('my/certificates/', MyCertificatesView.as_view(), name='my_certificates'),
    path('events/<int:event_id>/certificates/', EventCertificatesView.as_view(), name='event_certificates'),
    path('events/<int:event_id>/certificate/download/', DownloadMyEventCertificateView.as_view(), name='download_my_event_certificate'),
    path('certificates/<int:certificate_id>/download/', DownloadCertificateView.as_view(), name='download_certificate'),
]
