import uuid
from decimal import Decimal
from urllib.parse import urlparse

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from events.models import Event
from participation.models import EventRegistration
from participation.utils import ensure_event_qr_active

from .models import PaymentTransaction
from .serializers import PaymentTransactionSerializer
from .services import KhaltiError, initiate_payment, lookup_payment


def _safe_return_url(candidate):
    """Only accept an http(s) return_url from the client; otherwise fall back
    to the configured default. The return_url merely tells Khalti where to
    redirect the browser — verification is always done server-side by pidx —
    so this is safe, but we still reject non-http schemes defensively."""
    if isinstance(candidate, str) and candidate:
        parsed = urlparse(candidate)
        if parsed.scheme in ('http', 'https') and parsed.netloc:
            return candidate
    return settings.KHALTI_RETURN_URL


def _register_user_for_event(event, user):
    """Create the EventRegistration for a paid event, idempotently.

    Returns ``(registration, error_detail)``. ``error_detail`` is a string only
    when registration genuinely cannot proceed (e.g. capacity filled while the
    payment was in flight); the caller decides how to surface it.
    """
    existing = EventRegistration.objects.filter(event=event, user=user).first()
    if existing:
        return existing, None

    if event.max_participants is not None:
        current = EventRegistration.objects.filter(event=event).count()
        if current >= event.max_participants:
            return None, 'This event reached maximum capacity before your payment completed.'

    registration = EventRegistration.objects.create(event=event, user=user)
    ensure_event_qr_active(event)
    return registration, None


class InitiatePaymentView(APIView):
    """POST: start a Khalti payment for the current student to register for an event.

    Body: none required. Optional ``return_url`` (the frontend callback URL).
    Returns ``{ pidx, payment_url, purchase_order_id, amount }``.
    The frontend redirects the browser to ``payment_url``.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        user = request.user

        if user.user_type != 'Student':
            return Response(
                {'detail': 'Only students can pay for event registration.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.status != 'Approved':
            return Response(
                {'detail': 'You can only register for approved events.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not event.payment_required:
            return Response(
                {'detail': 'This event does not require payment. Please register directly.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if EventRegistration.objects.filter(event=event, user=user).exists():
            return Response(
                {'detail': 'You are already registered for this event.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.max_participants is not None:
            current = EventRegistration.objects.filter(event=event).count()
            if current >= event.max_participants:
                return Response(
                    {'detail': 'This event has reached maximum capacity.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        amount_paisa = int((event.fee or Decimal('0')) * 100)
        if amount_paisa < settings.KHALTI_MIN_AMOUNT_PAISA:
            return Response(
                {'detail': (
                    f'The event fee must be at least NPR '
                    f'{settings.KHALTI_MIN_AMOUNT_PAISA / 100:.0f} to accept online payment. '
                    'Please contact the organizer.'
                )},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reuse a still-actionable transaction if the student already started
        # one for this event (avoids piling up orphan rows on retries).
        pending = (
            PaymentTransaction.objects
            .filter(user=user, event=event,
                    status__in=[PaymentTransaction.STATUS_INITIATED,
                                PaymentTransaction.STATUS_PENDING])
            .first()
        )
        if pending and pending.payment_url and pending.amount_paisa == amount_paisa:
            return Response({
                'pidx': pending.pidx,
                'payment_url': pending.payment_url,
                'purchase_order_id': pending.purchase_order_id,
                'amount': str(pending.amount),
            })

        purchase_order_id = f'evt{event.id}-usr{user.id}-{uuid.uuid4().hex[:12]}'
        return_url = _safe_return_url(request.data.get('return_url'))

        try:
            khalti_response = initiate_payment(
                amount_paisa=amount_paisa,
                purchase_order_id=purchase_order_id,
                purchase_order_name=event.title[:120],
                return_url=return_url,
                website_url=settings.KHALTI_WEBSITE_URL,
                customer_info={
                    'name': user.full_name,
                    'email': user.email,
                },
            )
        except KhaltiError as exc:
            return Response(
                {'detail': exc.detail},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        transaction_row = PaymentTransaction.objects.create(
            user=user,
            event=event,
            pidx=khalti_response['pidx'],
            purchase_order_id=purchase_order_id,
            amount=event.fee,
            amount_paisa=amount_paisa,
            status=PaymentTransaction.STATUS_INITIATED,
            payment_url=khalti_response['payment_url'],
            initiate_response=khalti_response,
        )

        return Response({
            'pidx': transaction_row.pidx,
            'payment_url': transaction_row.payment_url,
            'purchase_order_id': transaction_row.purchase_order_id,
            'amount': str(transaction_row.amount),
        }, status=status.HTTP_201_CREATED)


class VerifyPaymentView(APIView):
    """POST: verify a Khalti payment by ``pidx`` and finalize registration.

    Body: ``{ "pidx": "..." }``. Called by the frontend callback page after
    Khalti redirects the browser back. The real source of truth is Khalti's
    server-side lookup — we never trust the status from the redirect query.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pidx = request.data.get('pidx')
        if not pidx:
            return Response(
                {'detail': 'pidx is required to verify a payment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        txn = PaymentTransaction.objects.filter(pidx=pidx).first()
        if not txn:
            return Response(
                {'detail': 'No matching payment was found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # A student may only verify their own payment.
        if txn.user_id != request.user.id:
            return Response(
                {'detail': 'You are not allowed to verify this payment.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Already finalized — return the stored outcome without re-hitting Khalti.
        if txn.status == PaymentTransaction.STATUS_COMPLETED:
            registered = EventRegistration.objects.filter(
                event=txn.event, user=txn.user).exists()
            return Response(self._result(txn, registered=registered))

        # `status` is only consulted for mock transactions (see lookup_payment);
        # real payments are verified against Khalti and ignore this value.
        mock_status = request.data.get('status')
        try:
            lookup = lookup_payment(pidx, mock_status=mock_status)
        except KhaltiError as exc:
            return Response({'detail': exc.detail}, status=status.HTTP_502_BAD_GATEWAY)

        khalti_status = lookup.get('status', '')
        mapped = PaymentTransaction.KHALTI_STATUS_MAP.get(
            khalti_status, PaymentTransaction.STATUS_FAILED)

        registered = False
        registration_error = None

        with transaction.atomic():
            # Lock the row so two concurrent callback requests can't both create
            # a registration / double-process the same payment.
            txn = PaymentTransaction.objects.select_for_update().get(pk=txn.pk)
            txn.status = mapped
            txn.verification_response = lookup
            if lookup.get('transaction_id'):
                txn.transaction_id = lookup['transaction_id']
            txn.save(update_fields=['status', 'verification_response',
                                    'transaction_id', 'updated_at'])

            if mapped == PaymentTransaction.STATUS_COMPLETED:
                registration, registration_error = _register_user_for_event(
                    txn.event, txn.user)
                registered = registration is not None

        return Response(self._result(
            txn, registered=registered, registration_error=registration_error))

    @staticmethod
    def _result(txn, *, registered, registration_error=None):
        payload = {
            'status': txn.status,
            'is_completed': txn.is_completed,
            'registered': registered,
            'event_id': txn.event_id,
            'event_title': txn.event.title,
            'amount': str(txn.amount),
            'transaction_id': txn.transaction_id,
            'pidx': txn.pidx,
        }
        if txn.is_completed:
            payload['detail'] = (
                'Payment successful — you are registered for the event!'
                if registered else
                'Payment successful.'
            )
        elif txn.status == PaymentTransaction.STATUS_PENDING:
            payload['detail'] = 'Your payment is still being processed. Please check back shortly.'
        elif txn.status == PaymentTransaction.STATUS_CANCELLED:
            payload['detail'] = 'The payment was cancelled. You have not been charged.'
        elif txn.status == PaymentTransaction.STATUS_EXPIRED:
            payload['detail'] = 'The payment session expired. Please try again.'
        else:
            payload['detail'] = 'The payment could not be completed. Please try again.'
        if registration_error:
            payload['registration_error'] = registration_error
        return payload


class MyPaymentsView(generics.ListAPIView):
    """GET: the current student's payment history."""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            PaymentTransaction.objects
            .select_related('event')
            .filter(user=self.request.user)
        )
