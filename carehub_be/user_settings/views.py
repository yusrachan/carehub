from django.db import transaction
from django.http import JsonResponse
from rest_framework import generics, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from accounts.models import User, UserOfficeRole
from .serializers import (
    MeSerializer, MeUpdateSerializer, ChangePasswordSerializer,
    OfficeMemberSerializer, UpdateMemberRoleSerializer
)
from .permissions import IsMemberOfOffice, IsManagerOrSecretaryOfOffice
from subscriptions.utils import sync_quantity_to_stripe


# =========
#  ME / PROFIL
# =========

class MeView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        ser = MeUpdateSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(MeSerializer(request.user).data)


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if not request.user.check_password(ser.validated_data['old_password']):
            return Response({'detail': 'Mot de passe actuel incorrect.'}, status=400)
        request.user.set_password(ser.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Mot de passe modifié.'})


# =========
#  EMPLOYÉS DU CABINET
# =========

class OfficeMembersViewSet(viewsets.ViewSet):
    """
    Ressource en lecture pour lister les employés d’un cabinet.
    Route: /api/settings/offices/<office_id>/members/
    """
    permission_classes = [IsAuthenticated, IsMemberOfOffice]

    def list(self, request, office_id=None):
        rel_qs = UserOfficeRole.objects.filter(office_id=office_id).select_related('user')
        user_ids = rel_qs.values_list('user_id', flat=True)
        users = User.objects.filter(id__in=user_ids).order_by('surname', 'name')
        ser = OfficeMemberSerializer(users, many=True, context={'office_id': office_id})
        return Response(ser.data)


class InviteMemberView(generics.GenericAPIView):
    """
    Stub d'invitation
    """
    permission_classes = [IsAuthenticated, IsManagerOrSecretaryOfOffice]

    def post(self, request, office_id=None):
        email = (request.data.get('email') or '').strip().lower()
        role = (request.data.get('role') or 'practitioner').strip()
        if not email:
            return Response({'detail': 'Email requis.'}, status=400)

        return Response({'detail': 'Invitation en file d’envoi.', 'email': email, 'role': role}, status=201)


class UpdateMemberRoleView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsManagerOrSecretaryOfOffice]
    serializer_class = UpdateMemberRoleSerializer

    @transaction.atomic
    def patch(self, request, office_id=None, user_id=None):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            rel = UserOfficeRole.objects.select_for_update().get(office_id=office_id, user_id=user_id)
        except UserOfficeRole.DoesNotExist:
            return Response({'detail': 'Membre introuvable dans ce cabinet.'}, status=404)

        rel.role = ser.validated_data['role']
        rel.save(update_fields=['role'])
        return Response({'detail': 'Rôle mis à jour.'}, status=200)


class ToggleMemberActiveView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsManagerOrSecretaryOfOffice]

    @transaction.atomic
    def patch(self, request, office_id=None, user_id=None):
        try:
            rel = UserOfficeRole.objects.select_for_update().get(office_id=office_id, user_id=user_id)
        except UserOfficeRole.DoesNotExist:
            return Response({'detail': 'Membre introuvable dans ce cabinet.'}, status=404)

        rel.is_active = not bool(rel.is_active)
        rel.save(update_fields=['is_active'])

        try:
            sync_quantity_to_stripe(office_id)
        except Exception as e:
            print("Stripe qty sync error: ", e)
            
        return Response({'detail': 'Statut mis à jour.', 'is_active': rel.is_active}, status=200)
