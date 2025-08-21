from django.utils import timezone
from rest_framework.permissions import BasePermission
from offices.models import Office
from subscriptions.models import Subscription
from accounts.models import UserOfficeRole
import logging

log = logging.getLogger(__name__)

class RequireActiveSubscription(BasePermission):
    message = "Votre abonnement n'est pas actif."

    def has_permission(self, request, view):
        office = None
        office_id = request.headers.get("X-Office-Id")
        log.info("SubCheck: user=%s, X-Office-Id=%s", request.user, office_id)

        if office_id:
            try:
                office = Office.objects.select_related("subscription").get(pk=office_id)
            except Office.DoesNotExist:
                log.warning("SubCheck: office %s introuvable", office_id)
                return False
        else:
            uor = UserOfficeRole.objects.filter(user=request.user, is_active=True).order_by("id").first()
            log.info("SubCheck: uor=%s", uor)
            if not uor:
                return False
            office = uor.office

        sub = getattr(office, "subscription", None) or Subscription.objects.filter(office=office).first()
        log.info("SubCheck: office.id=%s is_paid=%s sub=%s stripe=%s grace=%s start=%s end=%s pay_status=%s",
                 office.id, office.is_paid, bool(sub),
                 getattr(sub, "stripe_status", None),
                 getattr(sub, "grace_until", None),
                 getattr(sub, "start_date", None),
                 getattr(sub, "end_date", None),
                 getattr(sub, "payment_status", None))

        if getattr(office, "is_paid", False):
            return True

        if not sub:
            return False

        if (sub.stripe_status or "").lower() in ("active", "trialing"):
            return True

        if sub.grace_until and timezone.now() <= sub.grace_until:
            return True

        if sub.start_date and sub.end_date:
            today = timezone.now().date()
            if sub.start_date <= today <= sub.end_date:
                return True

        if getattr(sub, "payment_status", "") == "paid":
            return True

        return False