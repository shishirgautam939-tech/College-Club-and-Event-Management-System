from rest_framework import serializers
from .models import Event, EventApproval


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


class EventDiscoverySerializer(serializers.ModelSerializer):
    """Read-only serializer for approved events with registration info."""
    club_name = serializers.CharField(source='club.club_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    registration_count = serializers.IntegerField(read_only=True)
    is_registered = serializers.BooleanField(read_only=True)
    spots_left = serializers.SerializerMethodField()

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
        ]

    def get_spots_left(self, obj):
        if obj.max_participants is None:
            return None  # unlimited
        return max(0, obj.max_participants - (obj.registration_count or 0))


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
