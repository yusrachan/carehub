from rest_framework.permissions import BasePermission
from accounts.models import UserOfficeRole

def _relation(request, office_id):
    if not request.user.is_authenticated or not office_id:
        return None
    return UserOfficeRole.objects.filter(office_id=office_id, user=request.user).first()

class IsMemberOfOffice(BasePermission):
    """
    Autorise si l'utilisateur appartient au cabinet (quel que soit son rôle).
    """
    def has_permission(self, request, view):
        office_id = view.kwargs.get('office_id')
        return _relation(request, office_id) is not None


class IsManagerOrSecretaryOfOffice(BasePermission):
    """
    Autorise uniquement les rôles manager/secretary pour les actions de gestion.
    """
    def has_permission(self, request, view):
        office_id = view.kwargs.get('office_id')
        rel = _relation(request, office_id)
        return bool(rel and rel.role in ['manager', 'secretary'])
