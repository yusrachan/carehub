from datetime import timezone
from rest_framework.permissions import BasePermission
from subscriptions.models import Subscription
from accounts.models import UserOfficeRole

class RequireActiveSubscription(BasePermission):
    message = "Votre abonnement n'est pas actif."

    def has_permission(self, request, view):
        uor = UserOfficeRole.objects.filter(user=request.user, is_active=True).order_by('created_at').first()
        if not uor:
            return False
        sub = Subscription.objects.filter(office=uor.office).first()
        if not sub:
            return False
        if sub.stripe_status in ("active", "trialing"):
            return True
        if sub.grace_until and timezone.now() <= sub.grace_until:
            return True
        return False