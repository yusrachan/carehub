import stripe
from django.conf import settings
from accounts.models import UserOfficeRole
from subscriptions.views import seats_for_office
from .models import Subscription

def active_employees_count(office_id) -> int:
    return UserOfficeRole.objects.filter(office_id=office_id, is_active=True).count()

def seats_cap_for_plan(plan_code: str):
    return settings.SEAT_CAPS.get(plan_code)

def can_activate_one_more(office) -> bool:
    cap = seats_cap_for_plan(getattr(office, 'plan', None) or getattr(getattr(office, 'subscription', None), 'plan', None))
    if not cap:
        return True
    
    return active_employees_count(office.id) < cap

def sync_quantity_to_stripe(office_id):
    """
    Met à jour la quantité de l'abonnement Stripe our le cabinet donné.
    Crée une proration si la quantité change en cours de période.
    """
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