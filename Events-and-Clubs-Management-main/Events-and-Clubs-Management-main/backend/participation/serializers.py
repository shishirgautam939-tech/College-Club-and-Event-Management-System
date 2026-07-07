import base64
import io

from rest_framework import serializers

from .models import EventRegistration, Attendance, Certificate
from .utils import build_qr_payload

try:
    import qrcode
except ImportError:
    qrcode = None


class EventRegistrationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    roll_number = serializers.CharField(source='user.roll_number', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            'id',
            'event',
            'event_title',
            'user',
            'user_name',
            'user_email',
            'roll_number',
            'registered_at',
        ]
        read_only_fields = ['user', 'registered_at']


class AttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    roll_number = serializers.CharField(source='user.roll_number', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'event',
            'user',
            'user_name',
            'user_email',
            'roll_number',
            'present',
            'marked_at',
        ]
        read_only_fields = ['event', 'user', 'marked_at']


class MyRegistrationSerializer(serializers.ModelSerializer):
    """For student's "My Events" view — shows event details + attendance."""
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateTimeField(source='event.event_date', read_only=True)
    event_status = serializers.CharField(source='event.status', read_only=True)
    club_name = serializers.CharField(source='event.club.club_name', read_only=True)
    venue = serializers.CharField(source='event.venue', read_only=True)
    attendance_status = serializers.SerializerMethodField()
    attendance_qr_active = serializers.BooleanField(source='event.attendance_qr_active', read_only=True)
    attendance_qr_expires_at = serializers.DateTimeField(source='event.attendance_qr_expires_at', read_only=True)
    qr_image_base64 = serializers.SerializerMethodField()
    qr_payload = serializers.SerializerMethodField()
    has_certificate = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = [
            'id',
            'event',
            'event_title',
            'event_date',
            'event_status',
            'club_name',
            'venue',
            'registered_at',
            'attendance_status',
            'attendance_qr_active',
            'attendance_qr_expires_at',
            'qr_payload',
            'qr_image_base64',
            'has_certificate',
        ]

    def get_attendance_status(self, obj):
        """Return attendance status: 'Present', 'Absent', or None (not yet marked)."""
        try:
            record = Attendance.objects.get(event=obj.event, user=obj.user)
            return 'Present' if record.present else 'Absent'
        except Attendance.DoesNotExist:
            return None

    def get_qr_payload(self, obj):
        if obj.event.attendance_qr_token:
            return build_qr_payload(obj.event.id, obj.event.attendance_qr_token)
        return None

    def get_qr_image_base64(self, obj):
        if not qrcode or not obj.event.attendance_qr_token:
            return None

        qr_data = build_qr_payload(obj.event.id, obj.event.attendance_qr_token)
        qr = qrcode.QRCode(version=1, box_size=6, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color='#2F5233', back_color='white')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    def get_has_certificate(self, obj):
        if obj.event.status != 'Completed':
            return False
        return Certificate.objects.filter(event=obj.event, user=obj.user).exists()


class CertificateSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    club_name = serializers.CharField(source='event.club.club_name', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    download_url = serializers.SerializerMethodField()
    qr_payload = serializers.SerializerMethodField()
    qr_image_base64 = serializers.SerializerMethodField()
    has_certificate = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id',
            'certificate_code',
            'event',
            'event_title',
            'club_name',
            'user',
            'user_name',
            'issued_at',
            'download_url',
            'qr_payload',
            'qr_image_base64',
            'has_certificate',
        ]

    def get_download_url(self, obj):
        return f'/api/certificates/download/{obj.certificate_code}/'

    def get_qr_payload(self, obj):
        request = self.context.get('request')
        download_url = self.get_download_url(obj)
        if request:
            return request.build_absolute_uri(download_url)
        return download_url

    def get_qr_image_base64(self, obj):
        if not qrcode:
            return None

        payload = self.get_qr_payload(obj)
        if not payload:
            return None

        qr = qrcode.QRCode(version=1, box_size=7, border=2)
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color='#2F5233', back_color='white')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    def get_has_certificate(self, obj):
        return bool(obj.pdf_file)
