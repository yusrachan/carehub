from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ProfileView, LogoutView, MeView, check_secretary_email, deactivate_user_global, grant_role, invitation_detail, invite_user, office_members, reactivate_user_global, register_join, register_user, check_inami, RegisterFullAccount, revoke_role

urlpatterns = [
    path('register/', register_user, name='register_user'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register-full-account/', RegisterFullAccount.as_view(), name='register_full_account'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('offices/<int:office_id>/members/', office_members, name='office-members'),

    path('check-inami/', check_inami, name='check-inami'),
    path('check-secretary-email/', check_secretary_email, name='check_secretary_email'),
    path('invite-user/', invite_user, name='invite_user'),
    path('invitation-detail/', invitation_detail, name='invitation_detail'),
    path('register-join/', register_join, name='register_join'),
    path('api/subscriptions/', include('subscriptions.urls')),

    path('users/deactivate/', deactivate_user_global, name="user-deactivate"),
    path('users/reactivate/', reactivate_user_global, name="user-reactivate"),
    path('roles/revoke/', revoke_role, name="role-revoke"),
    path('roles/grant/', grant_role, name="role-grant"),
]