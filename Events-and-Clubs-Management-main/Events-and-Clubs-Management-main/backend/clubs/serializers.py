from rest_framework import serializers
from .models import Club, ClubMember, Department


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'department_name']


class ClubSerializer(serializers.ModelSerializer):
    faculty_coordinator_name = serializers.CharField(
        source='faculty_coordinator.full_name', read_only=True
    )

    class Meta:
        model = Club
        fields = [
            'id',
            'club_name',
            'description',
            'is_council',
            'faculty_coordinator',
            'faculty_coordinator_name',
            'created_at',
        ]


class ClubMemberSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    roll_number = serializers.CharField(source='user.roll_number', read_only=True)

    class Meta:
        model = ClubMember
        fields = [
            'id',
            'club',
            'user',
            'full_name',
            'email',
            'roll_number',
            'position',
            'joined_at',
        ]