from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.models import User
from events.models import Event
from clubs.models import Club
from .models import EventRegistration, Certificate
from .serializers import MyRegistrationSerializer
from .utils import build_qr_payload, decode_qr_payload, issue_certificates_for_event
from .views import DownloadMyEventCertificateView


class QRPayloadTests(SimpleTestCase):
    def test_build_and_decode_qr_payload(self):
        payload = build_qr_payload(42, "token-123")
        self.assertEqual(payload, "event-attendance://42/token-123")
        self.assertEqual(
            decode_qr_payload(payload),
            {"event_id": 42, "token": "token-123"},
        )

    def test_decode_legacy_json_qr_payload(self):
        payload = '{"event_id": 7, "token": "legacy-token"}'
        self.assertEqual(
            decode_qr_payload(payload),
            {"event_id": 7, "token": "legacy-token"},
        )


class StudentRegistrationQRTests(TestCase):
    def test_registration_serializer_exposes_qr_payload_when_token_exists(self):
        club = Club.objects.create(club_name='Test Club', description='Test')
        creator = User.objects.create_user(
            email='creator@example.com',
            password='test1234',
            full_name='Creator',
            user_type='Faculty',
        )
        student = User.objects.create_user(
            email='student@example.com',
            password='test1234',
            full_name='Student User',
            user_type='Student',
        )
        event = Event.objects.create(
            title='Test Event',
            description='Demo',
            organizer_type='Club',
            club=club,
            created_by=creator,
            status='Approved',
            event_date='2030-01-01T10:00:00Z',
            attendance_qr_token='abc123',
            attendance_qr_active=False,
        )
        registration = EventRegistration.objects.create(event=event, user=student)

        data = MyRegistrationSerializer(registration).data

        self.assertEqual(data['qr_payload'], build_qr_payload(event.id, 'abc123'))

    def test_issue_certificates_for_event_creates_certificates_for_registered_students(self):
        club = Club.objects.create(club_name='Test Club', description='Test')
        creator = User.objects.create_user(
            email='creator2@example.com',
            password='test1234',
            full_name='Creator',
            user_type='Faculty',
        )
        student = User.objects.create_user(
            email='student2@example.com',
            password='test1234',
            full_name='Student Two',
            user_type='Student',
        )
        event = Event.objects.create(
            title='Completed Event',
            description='Demo',
            organizer_type='Club',
            club=club,
            created_by=creator,
            status='Completed',
            event_date='2030-01-01T10:00:00Z',
        )
        EventRegistration.objects.create(event=event, user=student)

        issued = issue_certificates_for_event(event)

        self.assertEqual(len(issued), 1)
        self.assertTrue(Certificate.objects.filter(event=event, user=student).exists())

    def test_download_view_generates_certificate_for_completed_registered_event(self):
        factory = APIRequestFactory()
        club = Club.objects.create(club_name='Test Club', description='Test')
        creator = User.objects.create_user(
            email='creator3@example.com',
            password='test1234',
            full_name='Creator',
            user_type='Faculty',
        )
        student = User.objects.create_user(
            email='student3@example.com',
            password='test1234',
            full_name='Student Three',
            user_type='Student',
        )
        event = Event.objects.create(
            title='Completed Event 2',
            description='Demo',
            organizer_type='Club',
            club=club,
            created_by=creator,
            status='Completed',
            event_date='2030-01-01T10:00:00Z',
        )
        EventRegistration.objects.create(event=event, user=student)

        request = factory.get(f'/api/events/{event.id}/certificate/download/')
        force_authenticate(request, student)

        response = DownloadMyEventCertificateView.as_view()(request, event_id=event.id)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
