import base64
import io

from rest_framework import serializers

try:
    import qrcode
except ImportError:
    qrcode = None

from django.utils import timezone

from .models import Event, EventApproval
from participation.utils import build_qr_payload, is_event_qr_active


class EventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True
    )
    club_name = serializers.CharField(
        source='club.club_name', read_only=True
    )

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'organizer_type',
            'club',
            'club_name',
            'created_by',
            'created_by_name',
            'status',
            'venue',
            'max_participants',
            'event_date',
            'created_at',
        ]
        read_only_fields = ['created_by', 'status', 'created_at', 'organizer_type']

    def validate_event_date(self, value):
        """Reject events scheduled in the past.

        Naive datetimes coming off a `<input type="datetime-local">` are
        interpreted as the project's local time (Django's default
        ``USE_TZ`` behaviour on this project). We compare against
        ``timezone.now()`` so we don't reject events that are merely an
        hour or two away in a different timezone.
        """
        if value is None:
            return value
        # If a naive datetime is sent, treat it as the project's local time.
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.get_current_timezone())
        if value < timezone.now():
            raise serializers.ValidationError(
                "Event date must be in the future. Please pick a later date and time."
            )
        return value


class EventDiscoverySerializer(serializers.ModelSerializer):
    """Read-only serializer for approved events with registration info."""
    club_name = serializers.CharField(source='club.club_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    registration_count = serializers.IntegerField(read_only=True)
    is_registered = serializers.BooleanField(read_only=True)
    spots_left = serializers.SerializerMethodField()
    # Student-side QR for showing at the venue. Only populated when the
    # requester is registered for the event, so the field is always null
    # for other viewers (admin/faculty scrolling the discovery page).
    attendance_qr_active = serializers.SerializerMethodField()
    attendance_qr_expires_at = serializers.DateTimeField(read_only=True)
    qr_payload = serializers.SerializerMethodField()
    qr_image_base64 = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'organizer_type',
            'club',
            'club_name',
            'created_by_name',
            'status',
            'venue',
            'max_participants',
            'event_date',
            'created_at',
            'registration_count',
            'is_registered',
            'spots_left',
            'attendance_qr_active',
            'attendance_qr_expires_at',
            'qr_payload',
            'qr_image_base64',
        ]

    def get_spots_left(self, obj):
        if obj.max_participants is None:
            return None  # unlimited
        return max(0, obj.max_participants - (obj.registration_count or 0))

    def _show_qr(self, obj):
        """True only when the requester is registered AND the event is approved."""
        if not getattr(obj, 'is_registered', False):
            return False
        if obj.status != 'Approved':
            return False
        return True

    def get_attendance_qr_active(self, obj):
        if not self._show_qr(obj) or not obj.attendance_qr_token:
            return False
        return is_event_qr_active(obj)

    def get_qr_payload(self, obj):
        if not self._show_qr(obj) or not obj.attendance_qr_token:
            return None
        if not is_event_qr_active(obj):
            return None
        return build_qr_payload(obj.id, obj.attendance_qr_token)

    def get_qr_image_base64(self, obj):
        if not qrcode:
            return None
        if not self._show_qr(obj) or not obj.attendance_qr_token:
            return None
        if not is_event_qr_active(obj):
            return None
        qr_data = build_qr_payload(obj.id, obj.attendance_qr_token)
        qr = qrcode.QRCode(version=1, box_size=6, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color='#2F5233', back_color='white')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')


class EventApprovalSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(
        source='approved_by.full_name', read_only=True
    )

    class Meta:
        model = EventApproval
        fields = [
            'event',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'remarks',
            'decision',
        ]
        read_only_fields = ['event', 'approved_by', 'approved_at']
