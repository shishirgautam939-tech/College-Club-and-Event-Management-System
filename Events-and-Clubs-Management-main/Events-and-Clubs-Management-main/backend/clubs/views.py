from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Club, ClubMember
from .serializers import ClubSerializer, ClubMemberSerializer


class ClubListView(generics.ListCreateAPIView):
    """List all clubs or create a new club (Admin only)."""
    queryset = Club.objects.select_related('faculty_coordinator').order_by('club_name')
    serializer_class = ClubSerializer
    permission_classes = [IsAdminUser]


class ClubDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View, update, or delete a specific club (Admin only)."""
    queryset = Club.objects.select_related('faculty_coordinator')
    serializer_class = ClubSerializer
    permission_classes = [IsAdminUser]


class ClubMemberListView(generics.ListAPIView):
    """List members of a specific club (Admin only)."""
    serializer_class = ClubMemberSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        club_id = self.kwargs['club_id']
        return (
            ClubMember.objects
            .select_related('user', 'club')
            .filter(club_id=club_id)
            .order_by('position', 'user__full_name')
        )


class AddClubMemberView(APIView):
    """
    POST: Add a student member to a club.
    Body: { "user": <user_id>, "position": "Member" | "Event Manager" }
    """
    permission_classes = [IsAdminUser]

    def post(self, request, club_id):
        club = get_object_or_404(Club, pk=club_id)
        user_id = request.data.get('user')
        position = request.data.get('position', 'Member')

        if not user_id:
            return Response(
                {'detail': 'user field is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from accounts.models import User
        user = get_object_or_404(User, pk=user_id)

        if user.user_type != 'Student':
            return Response(
                {'detail': 'Only students can be club members.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ClubMember.objects.filter(club=club, user=user).exists():
            return Response(
                {'detail': 'This student is already a member of this club.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # A student can only belong to one club
        existing = ClubMember.objects.filter(user=user).select_related('club').first()
        if existing:
            return Response(
                {'detail': f'This student is already a member of "{existing.club.club_name}". A student can only belong to one club.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member = ClubMember.objects.create(
            club=club, user=user, position=position
        )
        return Response(
            ClubMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )


class RemoveClubMemberView(APIView):
    """DELETE: Remove a member from a club."""
    permission_classes = [IsAdminUser]

    def delete(self, request, club_id, member_id):
        member = get_object_or_404(ClubMember, pk=member_id, club_id=club_id)
        member.delete()
        return Response({'detail': 'Member removed successfully.'})
