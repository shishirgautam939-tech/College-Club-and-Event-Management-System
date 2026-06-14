from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import EventRegistration, Attendance
from .serializers import (
    EventRegistrationSerializer,
    AttendanceSerializer,
    MyRegistrationSerializer,
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
