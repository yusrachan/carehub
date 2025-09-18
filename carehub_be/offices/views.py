import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.http import JsonResponse

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes


from .models import Office
from .serializers import OfficeSerializer
from accounts.models import UserOfficeRole
from auditing.utils import log_audit

stripe.api_key = settings.STRIPE_SECRET_KEY
PLAN_PRICING = [('role_based', 'Basé sur rôle')]

class OfficeViewSet(viewsets.ModelViewSet):
    """
    CRUD sur cabinets en restreignant la liste aux cabinets liés à l'utilisateur courant
    """
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Office.objects.all()
        return Office.objects.filter(userofficerole__user=user).distinct()

    
class MyOffices(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Renvoie la liste des cabinets liés à l'utilisateur.
        """
        qs = (Office.objects.filter(userofficerole__user=request.user).values('id', 'name', 'userofficerole__role').order_by('name'))
        data = [
            {"id": row["id"], "name": row["name"], "role": row["userofficerole__role"]}
            for row in qs
        ]
        return Response(data)
    
def _actor_is_manager(user, office_id: int) -> bool:
    return UserOfficeRole.objects.filter(user=user, office_id=office_id, role="manager", is_active=True).exists()

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def archive_office(request, office_id: int):
    """
    Archive un cabinet
    """

    actor = request.user
    reason = (request.data.get("reason") or "").strip()
    office = Office.objects.filter(pk=office_id).first()

    if not office:
        return Response({"detail": "Cabinet introuvable"}, status=404)
    
    if not _actor_is_manager(actor, office_id) and not actor.is_superuser:
        return Response({"detail": "Interdit"}, status=403)
    
    if office.is_archived:
        return Response({"detail": "Déjà archivé"}, status=409)
    
    before = {"is_archived": office.is_archived}
    office.is_archived = True
    office.archived_at = timezone.now()
    office.save(update_fields=["is_archived", "archived_at"])
    after = {"is_archived": office.is_archived}

    log_audit("OFFICE_ARCHIVED", target_office_id=office.id, office_context_id=office.id, reason=reason, before=before, after=after)

    return Response({"message": "Cabinet archivé."}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def unarchive_office(request, office_id: int):
    """
    Désarchive un cabinet
    """

    actor = request.user
    reason = (request.data.get("reason") or "").strip()
    office = Office.objects.filter(pk=office_id).first()

    if not office:
        return Response({"detail": "Cabinet introuvable"}, status=404)
    
    if not _actor_is_manager(actor, office_id) and not actor.is_superuser:
        return Response({"detail": "Interdit"}, status=403)
    
    if not office.is_archived:
        return Response({"detail": "Déjà actif"}, status=409)
    
    before = {"is_archived": office.is_archived}
    office.is_archived = False
    office.save(update_fields=["is_archived"])
    after = {"is_archived": office.is_archived}

    log_audit("OFFICE_UNARCHIVED", target_office_id=office.id, office_context_id=office.id, reason=reason, before=before, after=after)
    
    return Response({"message": "Cabinet désarchivé."}, status=200)