from django.urls import path
from .views import (
    ClubListView, ClubDetailView, ClubMemberListView,
    AddClubMemberView, RemoveClubMemberView,
)

app_name = 'clubs'

urlpatterns = [
    path('clubs/', ClubListView.as_view(), name='club_list'),
    path('clubs/<int:pk>/', ClubDetailView.as_view(), name='club_detail'),
    path('clubs/<int:club_id>/members/', ClubMemberListView.as_view(), name='club_members'),
    path('clubs/<int:club_id>/members/add/', AddClubMemberView.as_view(), name='add_club_member'),
    path('clubs/<int:club_id>/members/<int:member_id>/remove/', RemoveClubMemberView.as_view(), name='remove_club_member'),
]