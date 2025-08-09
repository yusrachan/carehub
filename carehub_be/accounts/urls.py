from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ProfileView, LogoutView, MeView, invite_user, office_members, register_user, check_inami, invite_existing_user, RegisterFullAccount

urlpatterns = [
    path('register/', register_user, name='register_user'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register-full-account/', RegisterFullAccount.as_view(), name='register_full_account'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('offices/<int:office_id>/members/', office_members, name='office-members'),
    path('check-inami/', check_inami, name='check-inami'),
    path('invite-user/', invite_user, name='invite-user'),
    path('invite-existing-user/', invite_existing_user, name='invite-existing-user'),
    path('me/', MeView.as_view(), name='me'),
]