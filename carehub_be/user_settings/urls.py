from django.urls import path, include
from .views import MeView, ChangePasswordView
from .views import OfficeMembersViewSet, InviteMemberView, UpdateMemberRoleView, ToggleMemberActiveView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'offices/(?P<office_id>[^/.]+)/members', OfficeMembersViewSet, basename='office-members')

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),

    path('offices/<uuid:office_id>/invite/', InviteMemberView.as_view(), name='invite-member'),
    path('offices/<uuid:office_id>/members/<uuid:user_id>/role/', UpdateMemberRoleView.as_view(), name='update-member-role'),
    path('offices/<uuid:office_id>/members/<uuid:user_id>/toggle-active/', ToggleMemberActiveView.as_view(), name='toggle-member-active'),

    path('', include(router.urls)),
]
