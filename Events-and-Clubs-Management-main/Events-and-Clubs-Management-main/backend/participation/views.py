import base64
import io
import json

import qrcode
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
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
    can_manage_event_attendance,
    deactivate_event_qr,
    issue_certificate_for_attendee,
    issue_certificates_for_event,
    verify_qr_token,
)
from events.models import Event


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
        if not can_manage_event_attendance(request.user, event):
            return Response(
                {'detail': 'You do not have permission to manage QR attendance.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = {
            'event_id': event.id,
            'token': event.attendance_qr_token,
            'active': event.attendance_qr_active,
            'expires_at': event.attendance_qr_expires_at.isoformat() if event.attendance_qr_expires_at else None,
        }

        qr_image = None
        if event.attendance_qr_active and event.attendance_qr_token:
            qr_data = json.dumps({
                'event_id': event.id,
                'token': event.attendance_qr_token,
            })
            qr = qrcode.QRCode(version=1, box_size=8, border=2)
            qr.add_data(qr_data)
            qr.make(fit=True)
            img = qr.make_image(fill_color='#2F5233', back_color='white')
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            qr_image = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return Response({
            'event_id': event.id,
            'event_title': event.title,
            'qr_active': event.attendance_qr_active,
            'expires_at': payload['expires_at'],
            'qr_payload': payload,
            'qr_image_base64': qr_image,
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
        return (
            Certificate.objects
            .select_related('event', 'event__club')
            .filter(user=self.request.user)
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
        certificate = Certificate.objects.filter(event=event, user=request.user).first()
        if not certificate:
            attendance = Attendance.objects.filter(event=event, user=request.user, present=True).first()
            if not attendance:
                return Response(
                    {'detail': 'No certificate available. Attendance must be marked present first.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if event.status != 'Completed':
                return Response(
                    {'detail': 'Certificates are issued after the event is completed.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            certificate = issue_certificate_for_attendee(event, request.user)

        if not certificate.pdf_file:
            issue_certificate_for_attendee(event, request.user)
            certificate.refresh_from_db()

        return FileResponse(
            certificate.pdf_file.open('rb'),
            as_attachment=True,
            filename=f'certificate_{event.title.replace(" ", "_")}.pdf',
            content_type='application/pdf',
        )
