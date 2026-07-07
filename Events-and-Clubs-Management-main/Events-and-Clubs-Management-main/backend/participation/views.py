import base64
import io

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from .models import EventRegistration, Attendance, Certificate
from .serializers import (
    EventRegistrationSerializer,
    AttendanceSerializer,
    MyRegistrationSerializer,
    CertificateSerializer,
)
from .utils import (
    activate_event_qr,
    build_qr_payload,
    can_manage_event_attendance,
    deactivate_event_qr,
    decode_qr_payload,
    ensure_event_qr_active,
    issue_certificate_for_attendee,
    issue_certificates_for_event,
    is_event_qr_active,
    verify_qr_token,
)
from events.models import Event

try:
    import qrcode
except ImportError:
    qrcode = None


# ─── Event Registration ────────────────────────────────────────────

class RegisterForEventView(APIView):
    """
    POST: Register the current student for an approved event.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        user = request.user

        if user.user_type != 'Student':
            return Response(
                {'detail': 'Only students can register for events.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.status != 'Approved':
            return Response(
                {'detail': 'You can only register for approved events.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check capacity
        if event.max_participants is not None:
            current_count = EventRegistration.objects.filter(event=event).count()
            if current_count >= event.max_participants:
                return Response(
                    {'detail': 'This event has reached maximum capacity.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Check duplicate
        if EventRegistration.objects.filter(event=event, user=user).exists():
            return Response(
                {'detail': 'You are already registered for this event.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        registration = EventRegistration.objects.create(event=event, user=user)

        # Make sure the student has a usable attendance QR the moment they
        # register, so /dashboard can render the "Show my QR" button without
        # waiting for a coordinator to activate it. No-op if a token is live.
        ensure_event_qr_active(event)

        return Response(
            {
                'detail': 'Successfully registered for the event.',
                'registration_id': registration.id,
            },
            status=status.HTTP_201_CREATED,
        )


class UnregisterFromEventView(APIView):
    """
    DELETE: Unregister the current student from an event.
    Cannot unregister from completed events.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        user = request.user

        if event.status == 'Completed':
            return Response(
                {'detail': 'Cannot unregister from a completed event.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        registration = EventRegistration.objects.filter(event=event, user=user).first()
        if not registration:
            return Response(
                {'detail': 'You are not registered for this event.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        registration.delete()
        return Response({'detail': 'Successfully unregistered from the event.'})


class MyRegistrationsView(generics.ListAPIView):
    """
    GET: Returns the current student's registered events with attendance info.
    """
    serializer_class = MyRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            EventRegistration.objects
            .select_related('event', 'event__club')
            .filter(user=self.request.user)
            .order_by('-event__event_date')
        )

    def list(self, request, *args, **kwargs):
        # Lazy QR activation: a student who registered last week and visits
        # /my-events again should see a live QR without re-registering.
        # Only Approved events get a token; Completed events keep their
        # archived token (and the frontend hides the button).
        for reg in self.get_queryset():
            if reg.event.status == 'Approved':
                ensure_event_qr_active(reg.event)
        return super().list(request, *args, **kwargs)


# ─── Event Participants ────────────────────────────────────────────

class EventParticipantsView(generics.ListAPIView):
    """
    GET: Lists all registered participants for a specific event.
    Accessible by admin, faculty coordinator of the club, or event creator.
    """
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = self.kwargs['event_id']
        event = get_object_or_404(Event, pk=event_id)
        user = self.request.user

        is_admin = user.is_staff or user.user_type == 'Admin'
        is_coordinator = event.club and event.club.faculty_coordinator == user
        is_creator = event.created_by == user

        if not (is_admin or is_coordinator or is_creator):
            return EventRegistration.objects.none()

        return (
            EventRegistration.objects
            .select_related('user')
            .filter(event=event)
            .order_by('user__full_name')
        )


# ─── Attendance ────────────────────────────────────────────────────

class EventAttendanceView(APIView):
    """
    GET: Lists all registered students with their attendance status for an event.
    Accessible by admin, faculty coordinator, or event creator.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        user = request.user

        is_admin = user.is_staff or user.user_type == 'Admin'
        is_coordinator = event.club and event.club.faculty_coordinator == user
        is_creator = event.created_by == user

        if not (is_admin or is_coordinator or is_creator):
            return Response(
                {'detail': 'You do not have permission to view attendance.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get all registered students
        registrations = (
            EventRegistration.objects
            .select_related('user')
            .filter(event=event)
            .order_by('user__full_name')
        )

        # Get existing attendance records
        attendance_map = {
            a.user_id: a
            for a in Attendance.objects.filter(event=event)
        }

        data = []
        for reg in registrations:
            att = attendance_map.get(reg.user_id)
            data.append({
                'user_id': reg.user.id,
                'user_name': reg.user.full_name,
                'user_email': reg.user.email,
                'roll_number': reg.user.roll_number or '',
                'present': att.present if att else None,
                'marked_at': att.marked_at.isoformat() if att else None,
            })

        return Response({
            'event_id': event.id,
            'event_title': event.title,
            'event_status': event.status,
            'participants': data,
        })


class MarkAttendanceView(APIView):
    """
    POST: Mark attendance for an event.
    Body: { "attendance": [{ "user_id": 1, "present": true }, ...] }
    Accessible by admin, faculty coordinator, or event creator.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        user = request.user

        is_admin = user.is_staff or user.user_type == 'Admin'
        is_coordinator = event.club and event.club.faculty_coordinator == user
        is_creator = event.created_by == user

        if not (is_admin or is_coordinator or is_creator):
            return Response(
                {'detail': 'You do not have permission to mark attendance.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        attendance_data = request.data.get('attendance', [])
        if not attendance_data:
            return Response(
                {'detail': 'No attendance data provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get set of registered user IDs for this event
        registered_user_ids = set(
            EventRegistration.objects.filter(event=event)
            .values_list('user_id', flat=True)
        )

        updated = 0
        created = 0
        for entry in attendance_data:
            uid = entry.get('user_id')
            present = entry.get('present', False)

            if uid not in registered_user_ids:
                continue  # skip unregistered users

            obj, was_created = Attendance.objects.update_or_create(
                event=event,
                user_id=uid,
                defaults={'present': present},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({
            'detail': f'Attendance marked: {created} new, {updated} updated.',
            'event_id': event.id,
        })


class MyAttendanceView(generics.ListAPIView):
    """
    GET: Returns the current user's attendance records across all events.
    """
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Attendance.objects
            .select_related('event')
            .filter(user=self.request.user)
            .order_by('-event__event_date')
        )


# ─── QR Attendance ─────────────────────────────────────────────────

class EventQRAttendanceView(APIView):
    """
    GET: Return QR payload and image for organizers.
    POST: Activate or refresh QR attendance for an event.
    DELETE: Deactivate QR attendance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        user = request.user
        can_view_qr = can_manage_event_attendance(user, event)
        if not can_view_qr:
            if user.user_type != 'Student':
                return Response(
                    {'detail': 'You do not have permission to view QR attendance.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not EventRegistration.objects.filter(event=event, user=user).exists():
                return Response(
                    {'detail': 'You must be registered for this event to view its QR code.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        is_active = is_event_qr_active(event)
        qr_payload_str = None
        qr_image = None
        
        if is_active and event.attendance_qr_token:
            qr_payload_str = build_qr_payload(event.id, event.attendance_qr_token)
            
            if qrcode:
                qr = qrcode.QRCode(version=1, box_size=8, border=2)
                qr.add_data(qr_payload_str)
                qr.make(fit=True)
                img = qr.make_image(fill_color='#2F5233', back_color='white')
                buffer = io.BytesIO()
                img.save(buffer, format='PNG')
                qr_image = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return Response({
            'event_id': event.id,
            'event_title': event.title,
            'qr_active': is_active,
            'expires_at': event.attendance_qr_expires_at.isoformat() if event.attendance_qr_expires_at else None,
            'qr_payload': qr_payload_str,
            'qr_image_base64': qr_image,
            'can_scan': is_active and bool(event.attendance_qr_token),
        })

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        if not can_manage_event_attendance(request.user, event):
            return Response(
                {'detail': 'You do not have permission to manage QR attendance.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.status != 'Approved':
            return Response(
                {'detail': 'QR attendance can only be enabled for approved events.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hours_valid = int(request.data.get('hours_valid', 6))
        activate_event_qr(event, hours_valid=hours_valid)
        return self.get(request, event_id)

    def delete(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        if not can_manage_event_attendance(request.user, event):
            return Response(
                {'detail': 'You do not have permission to manage QR attendance.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        deactivate_event_qr(event)
        return Response({'detail': 'QR attendance deactivated.', 'event_id': event.id})


class VerifyQRAttendanceView(APIView):
    """
    POST: Student verifies attendance by scanning QR code.
    Body: { "event_id": 1, "token": "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.user_type != 'Student':
            return Response(
                {'detail': 'Only students can verify attendance with QR codes.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        event_id = request.data.get('event_id')
        token = request.data.get('token')
        if not event_id or not token:
            payload_text = request.data.get('payload') or request.data.get('qr_data')
            if payload_text:
                try:
                    payload = decode_qr_payload(payload_text)
                except ValueError as exc:
                    return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
                event_id = payload['event_id']
                token = payload['token']
            else:
                return Response(
                    {'detail': 'Both event_id and token are required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        event = get_object_or_404(Event, pk=event_id)
        valid, message = verify_qr_token(event, token)
        if not valid:
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        if not EventRegistration.objects.filter(event=event, user=user).exists():
            return Response(
                {'detail': 'You must be registered for this event before checking in.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attendance, created = Attendance.objects.update_or_create(
            event=event,
            user=user,
            defaults={'present': True, 'marked_via_qr': True},
        )

        return Response({
            'detail': 'Attendance verified successfully. Welcome to the event!',
            'event_id': event.id,
            'event_title': event.title,
            'present': attendance.present,
            'marked_at': attendance.marked_at.isoformat(),
            'already_checked_in': not created,
        })


# ─── Certificates ──────────────────────────────────────────────────

class MyCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        for registration in (
            EventRegistration.objects
            .filter(user=user, event__status='Completed')
            .select_related('event')
        ):
            issue_certificate_for_attendee(registration.event, user)

        return (
            Certificate.objects
            .select_related('event', 'event__club')
            .filter(user=user)
            .order_by('-issued_at')
        )


class EventCertificatesView(APIView):
    """
    GET: List certificates issued for an event.
    POST: Generate certificates for all present attendees.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        if not can_manage_event_attendance(request.user, event):
            return Response(
                {'detail': 'You do not have permission to view event certificates.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        certificates = Certificate.objects.filter(event=event).select_related('user')
        serializer = CertificateSerializer(certificates, many=True, context={'request': request})
        return Response({
            'event_id': event.id,
            'event_title': event.title,
            'certificates': serializer.data,
        })

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        if not can_manage_event_attendance(request.user, event):
            return Response(
                {'detail': 'You do not have permission to generate certificates.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.status != 'Completed':
            return Response(
                {'detail': 'Certificates can only be generated after the event is completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issued = issue_certificates_for_event(event)
        serializer = CertificateSerializer(issued, many=True, context={'request': request})
        return Response({
            'detail': f'Generated {len(issued)} certificate(s).',
            'certificates': serializer.data,
        })


class DownloadCertificateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, certificate_id):
        certificate = get_object_or_404(
            Certificate.objects.select_related('event', 'user'),
            pk=certificate_id,
        )
        user = request.user
        is_admin = user.is_staff or user.user_type == 'Admin'
        is_owner = certificate.user == user
        is_manager = can_manage_event_attendance(user, certificate.event)

        if not (is_owner or is_admin or is_manager):
            return Response(
                {'detail': 'You do not have permission to download this certificate.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not certificate.pdf_file:
            issue_certificate_for_attendee(certificate.event, certificate.user)
            certificate.refresh_from_db()

        return FileResponse(
            certificate.pdf_file.open('rb'),
            as_attachment=True,
            filename=f'certificate_{certificate.event.title.replace(" ", "_")}.pdf',
            content_type='application/pdf',
        )


class DownloadMyEventCertificateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        user = request.user
        if not user or getattr(user, 'is_authenticated', False) is False:
            return Response(
                {'detail': 'Authentication required.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        is_registered = EventRegistration.objects.filter(event=event, user=user).exists()
        has_present_attendance = Attendance.objects.filter(event=event, user=user, present=True).exists()

        if not is_registered and not has_present_attendance:
            return Response(
                {'detail': 'You are not registered for this event.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if event.status != 'Completed' and not has_present_attendance:
            return Response(
                {'detail': 'Certificates are issued after the event is completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        certificate = Certificate.objects.filter(event=event, user=user).first()
        if not certificate:
            certificate = issue_certificate_for_attendee(event, user)
        elif not certificate.pdf_file:
            certificate = issue_certificate_for_attendee(event, user)

        if not certificate:
            return Response(
                {'detail': 'No certificate available yet.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not certificate.pdf_file or not certificate.pdf_file.name:
            certificate = issue_certificate_for_attendee(event, user)
            if not certificate or not certificate.pdf_file or not certificate.pdf_file.name:
                return Response(
                    {'detail': 'Certificate could not be generated.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        try:
            certificate.refresh_from_db()
            return FileResponse(
                certificate.pdf_file.open('rb'),
                as_attachment=True,
                filename=f'certificate_{event.title.replace(" ", "_")}.pdf',
                content_type='application/pdf',
            )
        except FileNotFoundError:
            return Response(
                {'detail': 'Certificate file missing on disk.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as exc:
            return Response(
                {'detail': f'Error serving certificate: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DownloadCertificateByCodeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, certificate_code):
        certificate = get_object_or_404(
            Certificate.objects.select_related('event', 'user'),
            certificate_code=certificate_code,
        )

        # If there is no stored PDF, attempt to (re)generate it.
        needs_generation = not certificate.pdf_file or not certificate.pdf_file.name
        if not needs_generation:
            try:
                exists = certificate.pdf_file.storage.exists(certificate.pdf_file.name)
            except Exception:
                exists = False
            if not exists:
                needs_generation = True

        if needs_generation:
            issue_certificate_for_attendee(certificate.event, certificate.user)
            certificate.refresh_from_db()

        # Final existence check before attempting to open the file
        if not certificate.pdf_file or not certificate.pdf_file.name:
            return Response({'detail': 'Certificate file not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            file_name = f'certificate_{certificate.event.title.replace(" ", "_")}.pdf'
            return FileResponse(
                certificate.pdf_file.open('rb'),
                as_attachment=True,
                filename=file_name,
                content_type='application/pdf',
            )
        except FileNotFoundError:
            return Response({'detail': 'Certificate file missing on disk.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response({'detail': f'Error serving certificate: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
