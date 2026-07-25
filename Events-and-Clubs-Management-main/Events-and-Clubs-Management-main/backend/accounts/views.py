from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, UserSerializer, UserUpdateSerializer

from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from events.models import Event, EventApproval
from clubs.models import Club, ClubMember, Department
from participation.models import EventRegistration
from django.db import models


class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom Login View that returns extra user info (name, type)
    alongside the JWT tokens.
    """
    serializer_class = MyTokenObtainPairSerializer


class UserListView(generics.ListCreateAPIView):
    """
    Allows Admin to view all users and create new ones.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Allows Admin to view, edit, or delete a specific user.
    """
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'pk'


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)  # Anyone can sign up
    serializer_class = UserSerializer


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class DepartmentListView(generics.ListAPIView):
    """Lists all departments (for dropdowns)."""
    from clubs.serializers import DepartmentSerializer as _DeptSerializer
    queryset = Department.objects.all().order_by('department_name')
    serializer_class = _DeptSerializer
    permission_classes = [AllowAny]


class DashboardStatsView(APIView):
    """
    Returns aggregate stats for the Admin dashboard.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_students = User.objects.filter(user_type='Student').count()
        total_faculty = User.objects.filter(user_type='Faculty').count()
        total_clubs = Club.objects.count()
        total_events = Event.objects.count()
        pending_events = Event.objects.filter(status='Proposed').count()
        approved_events = Event.objects.filter(status='Approved').count()
        completed_events = Event.objects.filter(status='Completed').count()
        total_registrations = EventRegistration.objects.count()
        total_departments = Department.objects.count()

        # Per-branch student counts, in a fixed display order (drives the
        # mobile "Branch Distribution" grid). Branches with zero students
        # still appear, at 0, so the grid layout never loses a column.
        branch_counts = dict(
            User.objects.filter(user_type='Student', branch__isnull=False)
            .values_list('branch')
            .annotate(count=models.Count('id'))
        )
        branch_breakdown = [
            {'branch': code, 'label': label, 'count': branch_counts.get(code, 0)}
            for code, label in User.BRANCH_CHOICES
        ]

        # A club counts as "pending approval" if it has at least one event
        # still awaiting admin review. There's no separate club-approval
        # workflow in the data model, so this is the closest real signal.
        clubs_pending_approval = (
            Club.objects.filter(event__status='Proposed').distinct().count()
        )

        # Recent activity feed: merge the three event types the mobile
        # dashboard shows (proposal submitted, event approved, new student)
        # into one timeline, newest first.
        activity_items = []

        for event in Event.objects.select_related('club', 'created_by').order_by('-created_at')[:5]:
            submitter = event.club.club_name if event.club else event.created_by.full_name
            activity_items.append({
                'type': 'event_submitted',
                'message': f"{submitter} submitted ‘{event.title}’",
                'timestamp': event.created_at,
                'tone': 'success',
            })

        for approval in (
            EventApproval.objects.filter(decision='Approved')
            .select_related('event', 'approved_by')
            .order_by('-approved_at')[:5]
        ):
            approver = approval.approved_by.full_name if approval.approved_by else 'Admin'
            activity_items.append({
                'type': 'event_approved',
                'message': f"{approver} approved ‘{approval.event.title}’ event",
                'timestamp': approval.approved_at,
                'tone': 'info',
            })

        for student in User.objects.filter(user_type='Student').order_by('-created_at')[:5]:
            activity_items.append({
                'type': 'student_registered',
                'message': f"New student {student.full_name} registered",
                'timestamp': student.created_at,
                'tone': 'neutral',
            })

        activity_items.sort(key=lambda item: item['timestamp'], reverse=True)
        recent_activity = [
            {**item, 'timestamp': item['timestamp'].isoformat()}
            for item in activity_items[:8]
        ]

        return Response({
            'total_users': total_users,
            'total_students': total_students,
            'total_faculty': total_faculty,
            'total_clubs': total_clubs,
            'total_events': total_events,
            'pending_events': pending_events,
            'approved_events': approved_events,
            'completed_events': completed_events,
            'total_registrations': total_registrations,
            'total_departments': total_departments,
            'branch_breakdown': branch_breakdown,
            'clubs_pending_approval': clubs_pending_approval,
            'recent_activity': recent_activity,
        })
    