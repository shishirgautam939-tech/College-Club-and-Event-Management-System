from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, UserSerializer, UserUpdateSerializer

from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from events.models import Event
from clubs.models import Club, ClubMember, Department
from participation.models import EventRegistration


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
        })
    