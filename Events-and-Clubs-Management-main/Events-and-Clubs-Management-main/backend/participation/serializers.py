from rest_framework import serializers
from .models import EventRegistration, Attendance


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
        ]

    def get_attendance_status(self, obj):
        """Return attendance status: 'Present', 'Absent', or None (not yet marked)."""
        try:
            record = Attendance.objects.get(event=obj.event, user=obj.user)
            return 'Present' if record.present else 'Absent'
        except Attendance.DoesNotExist:
            return None
