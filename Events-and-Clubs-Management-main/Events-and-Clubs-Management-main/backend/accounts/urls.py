from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MyTokenObtainPairView, RegisterView, UserProfileView,
    UserListView, UserDetailView, DashboardStatsView,
    DepartmentListView,
)

app_name = 'accounts'

urlpatterns = [
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('departments/', DepartmentListView.as_view(), name='department_list'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
]