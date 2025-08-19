from django.utils import timezone
import stripe
from django.conf import settings
from django.core.exceptions import FieldDoesNotExist
from accounts.models import UserOfficeRole
from .models import Subscription

def active_employees_count(office_id) -> int:
    """Nombre de relations actives user↔office. Tolère l’absence du champ is_active."""
    qs = UserOfficeRole.objects.filter(office_id=office_id)
    try:
        UserOfficeRole._meta.get_field("is_active")
        qs = qs.filter(is_active=True)
    except FieldDoesNotExist:
        pass
    return qs.count()

def seats_cap_for_plan(plan_code: str):
    return settings.SEAT_CAPS.get(plan_code) if hasattr(settings, "SEAT_CAPS") else None

def can_activate_one_more(office) -> bool:
    cap = seats_cap_for_plan(getattr(office, 'plan', None) or getattr(getattr(office, 'subscription', None), 'plan', None))
    if not cap:
        return True
    
    return active_employees_count(office.id) < cap

def seats_for_office(office_id: int) -> int:
    """
    Ancienne dépendance à subscriptions.views supprimée.
    Si tu utilises un modèle 'seat-based', on renvoie simplement le nombre d’employés actifs.
    Adapte ici si tu as une logique différente (ex: compter seulement certaines roles).
    """
    return active_employees_count(office_id)

def sync_quantity_to_stripe(office_id):
    """
    Met à jour la quantité de l'abonnement Stripe our le cabinet donné.
    Crée une proration si la quantité change en cours de période.
    """
    from .models import Subscription
    sub = Subscription.objects.filter(
        office_id=office_id,
        stripe_subscription_id__isnull=False,
    ).first()
    if not sub:
        return
    
    stripe.api_key = settings.STRIPE_SECRET_KEY
    qty = seats_for_office(office_id)

    s = stripe.Subscription.retrieve(sub.stripe_subscription_id)
    item_id = s['items']['data'][0]['id']

    stripe.SubscriptionItem.modify(
        item_id,
        quantity=qty,
        proration_behavior='create_prorations',
    )

    sub.quantity = qty
    sub.save(update_fields=['quantity'])

def office_has_active_access(office) -> bool:
    """
    Accès: abonnement actif si Stripe renvoie 'active'.
    """
    try:
        sub = Subscription.objects.get(office=office)
    except Subscription.DoesNotExist:
        return False

    now = timezone.now()
    if sub.grace_until and sub.grace_until > now:
        return True

    status = (sub.stripe_status or "").lower()
    if status in {"active", "trialing"}:
        return True

    return False