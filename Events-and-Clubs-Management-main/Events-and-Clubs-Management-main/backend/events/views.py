from decimal import Decimal, InvalidOperation

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import Count, Exists, OuterRef

from .models import Event, EventApproval
from .serializers import EventSerializer, EventDiscoverySerializer
from clubs.models import Club, ClubMember
from participation.models import EventRegistration


class ProposeEventView(generics.CreateAPIView):
    """
    Club members (event managers) can propose an event for their club.
    Only students who are members of the given club can propose.
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        club = serializer.validated_data.get('club')
        user = self.request.user

        # Ensure the user is an Event Manager in the club
        if not ClubMember.objects.filter(club=club, user=user, position='Event Manager').exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only Event Managers of this club can propose events.')

        serializer.save(
            created_by=user,
            organizer_type='Club',
            status='Proposed',
        )


class MyClubsView(generics.ListAPIView):
    """
    Returns the clubs the current student is a member of 
    (so they can choose which club to propose events for).
    """
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        memberships = ClubMember.objects.select_related('club').filter(
            user=request.user, position='Event Manager'
        ).order_by('club__club_name')
        data = [
            {
                'club_id': m.club.id,
                'club_name': m.club.club_name,
                'position': m.position,
            }
            for m in memberships
        ]
        return Response(data)



class FacultyProposedEventsView(generics.ListAPIView):
    """
    Lists proposed events.
    - Admin: sees ALL proposed events across every club.
    - Faculty coordinator (HoD): sees proposed events only for their clubs.
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin can see all proposed events
        if user.is_staff or user.user_type == 'Admin':
            return Event.objects.select_related('club', 'created_by').filter(
                status='Proposed',
            ).order_by('-created_at')

        # Faculty coordinator sees only their clubs' proposals
        coordinated_clubs = Club.objects.filter(
            faculty_coordinator=user
        )
        return Event.objects.select_related('club', 'created_by').filter(
            club__in=coordinated_clubs,
            status='Proposed',
        ).order_by('-created_at')


class ReviewEventView(APIView):
    """
    Faculty coordinator (HoD) can approve or reject a proposed event.
    POST body: { "decision": "Approved" | "Rejected", "remarks": "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)

        # Admin can review any event; faculty must be the coordinator
        is_admin = request.user.is_staff or request.user.user_type == 'Admin'
        is_coordinator = event.club and event.club.faculty_coordinator == request.user

        if not is_admin and not is_coordinator:
            return Response(
                {'detail': 'You are not authorised to review this event.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.status != 'Proposed':
            return Response(
                {'detail': 'This event has already been reviewed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        decision = request.data.get('decision')
        if decision not in ('Approved', 'Rejected'):
            return Response(
                {'detail': 'Decision must be "Approved" or "Rejected".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        remarks = request.data.get('remarks', '')

        # Update event status
        event.status = decision
        event.save()

        # Create approval record
        EventApproval.objects.create(
            event=event,
            approved_by=request.user,
            decision=decision,
            remarks=remarks,
        )

        return Response({
            'detail': f'Event {decision.lower()} successfully.',
            'event_id': event.id,
            'status': event.status,
        })


class ApprovedEventsView(generics.ListAPIView):
    """
    Lists all approved (upcoming) events for discovery.
    Annotates each event with registration_count and is_registered (for current user).
    """
    serializer_class = EventDiscoverySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Event.objects.select_related('club', 'created_by')
            .prefetch_related('registrations')
            .filter(status='Approved')
            .annotate(
                registration_count=Count('registrations'),
                is_registered=Exists(
                    EventRegistration.objects.filter(
                        event=OuterRef('pk'), user=user
                    )
                ),
            )
            .order_by('event_date')
        )


class AllEventsView(generics.ListAPIView):
    """
    Lists events with optional status filter.
    - Admin: sees ALL events.
    - Faculty: sees events from their coordinated clubs only.
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_staff or user.user_type == 'Admin'

        if is_admin:
            qs = Event.objects.select_related('club', 'created_by').order_by('-created_at')
        elif user.user_type == 'Faculty':
            coordinated_clubs = Club.objects.filter(faculty_coordinator=user)
            qs = Event.objects.select_related('club', 'created_by').filter(
                club__in=coordinated_clubs
            ).order_by('-created_at')
        else:
            return Event.objects.none()

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class CompleteEventView(APIView):
    """
    Mark an approved event as Completed.
    Only the faculty coordinator of the club, or an admin, can complete it.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)

        is_admin = request.user.is_staff or request.user.user_type == 'Admin'
        is_coordinator = event.club and event.club.faculty_coordinator == request.user

        if not is_admin and not is_coordinator:
            return Response(
                {'detail': 'You are not authorised to complete this event.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.status != 'Approved':
            return Response(
                {'detail': 'Only approved events can be marked as completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event.status = 'Completed'
        event.save()

        from participation.utils import deactivate_event_qr, issue_certificates_for_event
        deactivate_event_qr(event)
        certificates = issue_certificates_for_event(event)

        return Response({
            'detail': 'Event marked as completed.',
            'event_id': event.id,
            'status': event.status,
            'certificates_issued': len(certificates),
        })


class EventPaymentSettingsView(APIView):
    """
    PATCH: enable/disable the payment requirement and set the fee for an event.
    Only the faculty coordinator (HoD) of the club, or an admin, may change this.

    Body: { "payment_required": true|false, "fee": <number, optional> }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)

        is_admin = request.user.is_staff or request.user.user_type == 'Admin'
        is_coordinator = event.club and event.club.faculty_coordinator == request.user
        if not is_admin and not is_coordinator:
            return Response(
                {'detail': 'You are not authorised to manage payments for this event.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data
        payment_required = data.get('payment_required', event.payment_required)
        if isinstance(payment_required, str):
            payment_required = payment_required.strip().lower() in ('true', '1', 'yes')
        payment_required = bool(payment_required)

        # Parse fee if provided; otherwise keep the existing value.
        if 'fee' in data and data.get('fee') not in (None, ''):
            try:
                fee = Decimal(str(data.get('fee')))
            except (InvalidOperation, ValueError, TypeError):
                return Response(
                    {'detail': 'Fee must be a valid number.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            fee = event.fee

        if fee < 0:
            return Response(
                {'detail': 'Fee cannot be negative.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # When enabling payment, the fee must be high enough for Khalti to accept.
        if payment_required:
            min_npr = settings.KHALTI_MIN_AMOUNT_PAISA / 100
            if fee < Decimal(str(min_npr)):
                return Response(
                    {'detail': f'To require payment, the fee must be at least NPR {min_npr:.0f}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        event.payment_required = payment_required
        event.fee = fee
        event.save(update_fields=['payment_required', 'fee'])

        return Response({
            'detail': 'Payment settings updated.',
            'event_id': event.id,
            'payment_required': event.payment_required,
            'fee': str(event.fee),
        })
