from django.urls import path
from .views import (
    ProposeEventView,
    MyClubsView,
    FacultyProposedEventsView,
    ReviewEventView,
    ApprovedEventsView,
    AllEventsView,
    CompleteEventView,
    EventPaymentSettingsView,
)

app_name = 'events'

urlpatterns = [
    path('events/propose/', ProposeEventView.as_view(), name='propose_event'),
    path('events/review/', FacultyProposedEventsView.as_view(), name='faculty_events'),
    path('events/<int:event_id>/review/', ReviewEventView.as_view(), name='review_event'),
    path('events/approved/', ApprovedEventsView.as_view(), name='approved_events'),
    path('events/all/', AllEventsView.as_view(), name='all_events'),
    path('events/<int:event_id>/complete/', CompleteEventView.as_view(), name='complete_event'),
    path('events/<int:event_id>/payment-settings/', EventPaymentSettingsView.as_view(), name='event_payment_settings'),
    path('clubs/my/', MyClubsView.as_view(), name='my_clubs'),
]
