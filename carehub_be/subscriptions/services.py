from __future__ import annotations

import datetime
import logging
from typing import Dict, List, Union

from django.conf import settings
from django.db import transaction
from django.utils import timezone

import stripe

from subscriptions.models import Subscription
from accounts.models import UserOfficeRole
from offices.models import Office

logger = logging.getLogger(__name__)

stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", None)
ROLE_PRICES: Dict[str, str] = getattr(settings, "STRIPE_ROLE_PRICES", {})
FRONTEND_URL: str = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
TRIAL_DAYS: int = int(getattr(settings, "SUBSCRIPTION_TRIAL_DAYS", 0) or 0)

def _model_has_field(model, field_name: str) -> bool:
    return any(getattr(f, "name", None) == field_name for f in model._meta.get_fields())


def _ensure_role_prices_ok():
    """Vérifie que la conf des prix par rôle est cohérente."""
    required = {"manager", "practitioner", "secretary"}
    missing = [r for r in required if not ROLE_PRICES.get(r)]
    if missing:
        raise ValueError(
            "STRIPE_ROLE_PRICES mal configuré (prix manquant pour rôles: "
            f"{', '.join(missing)}). Ajoute les price_id Stripe dans settings.py."
        )


def count_roles(office_id: int) -> Dict[str, int]:
    """
    Compte les rôles actifs pour un cabinet.
    Adapte le filtre si ton modèle dispose d'un booléen is_active.
    """
    qs = UserOfficeRole.objects.filter(office_id=office_id)
    if _model_has_field(UserOfficeRole, "is_active"):
        qs = qs.filter(is_active=True)

    counts = {"manager": 0, "practitioner": 0, "secretary": 0}
    for role in qs.values_list("role", flat=True):
        if role in counts:
            counts[role] += 1
    return counts


def _desired_items_from_counts(counts: Dict[str, int]) -> List[Dict[str, Union[str, int]]]:
    """
    Transforme les compteurs en liste d'items Stripe désirés:
    [{ "price": <price_id>, "quantity": <int> }, ...]
    """
    _ensure_role_prices_ok()
    items: List[Dict[str, Union[str, int]]] = []
    for role, qty in counts.items():
        if qty and qty > 0 and ROLE_PRICES.get(role):
            items.append({"price": ROLE_PRICES[role], "quantity": int(qty)})
    return items


def _ensure_customer(sub: Subscription, email: str) -> Subscription:
    """
    Crée le customer Stripe si absent, en ajoutant office_id dans metadata.
    """
    if not sub.stripe_customer_id:
        cust = stripe.Customer.create(
            email=email,
            metadata={"office_id": str(sub.office_id)},
        )
        sub.stripe_customer_id = cust["id"]
        sub.save(update_fields=["stripe_customer_id"])
    return sub


def _dt_from_ts(ts: int | None) -> datetime.datetime | None:
    if ts is None:
        return None
    return datetime.datetime.fromtimestamp(int(ts), tz=datetime.timezone.utc)

@transaction.atomic
def ensure_subscription_matches_roles(office: Office, customer_email: str) -> Union[Subscription, Dict[str, object]]:
    """
    1) Calcule les quantités par rôle (manager/practitioner/secretary) pour le cabinet.
    2) Si aucune souscription Stripe n'existe encore:
         - crée une Checkout Session (mode=subscription) avec les items désirés
         - si SUBSCRIPTION_TRIAL_DAYS > 0, ajoute une période d'essai
         - renvoie {"checkout_url": ..., "subscription": <sub>}
       (le webhook remplira ensuite stripe_subscription_id, status, périodes)
    3) Si une souscription existe:
         - met à jour/ajoute/supprime les items (proration on)
         - met à jour le statut et les dates localement
         - renvoie l'objet Subscription

    Retour:
      - dict avec "checkout_url" (si première souscription à payer)
      - ou l'instance Subscription mise à jour
    """
    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY manquant dans settings.py")

    counts = count_roles(office.id)
    desired_items = _desired_items_from_counts(counts)

    sub, _ = Subscription.objects.get_or_create(office=office)

    # S'assurer que le customer Stripe existe
    _ensure_customer(sub, customer_email)

    # Aucun membre facturable (pas d'items désirés)
    if not desired_items:
        # Si un abonnement existe déjà, on programme l'annulation en fin de période
        if sub.stripe_subscription_id:
            try:
                updated = stripe.Subscription.modify(
                    sub.stripe_subscription_id,
                    cancel_at_period_end=True,
                    proration_behavior="create_prorations",
                )
                sub.stripe_status = updated["status"]
                sub.cancel_at_period_end = True
                sub.current_period_start = _dt_from_ts(updated.get("current_period_start"))
                sub.current_period_end = _dt_from_ts(updated.get("current_period_end"))
                sub.save(update_fields=["stripe_status", "cancel_at_period_end",
                                       "current_period_start", "current_period_end"])
            except Exception as e:
                logger.warning("Impossible de programmer l'annulation Stripe: %s", e)
        else:
            # Pas d'abonnement, on note juste l'état local
            sub.stripe_status = "incomplete"
            sub.save(update_fields=["stripe_status"])
        return sub

    # Aucune souscription Stripe encore : on crée une Checkout Session
    if not sub.stripe_subscription_id:
        session_params = {
            "mode": "subscription",
            "customer": sub.stripe_customer_id,
            "line_items": [{"price": it["price"], "quantity": it["quantity"]} for it in desired_items],
            "allow_promotion_codes": True,
            "success_url": f"{FRONTEND_URL}/settings?checkout=success",
            "cancel_url": f"{FRONTEND_URL}/settings?checkout=cancel",
        }
        # Période d'essai optionnelle
        if TRIAL_DAYS > 0:
            session_params["subscription_data"] = {"trial_period_days": TRIAL_DAYS}

        session = stripe.checkout.Session.create(**session_params)
        # On renvoie l'URL pour rediriger l'utilisateur vers Stripe
        return {"checkout_url": session["url"], "subscription": sub}

    # --- Souscription existante : on synchronise les items (proration)
    current = stripe.Subscription.retrieve(
        sub.stripe_subscription_id,
        expand=["items.data.price"],
    )

    current_items = current["items"]["data"]  # liste d'items existants
    by_price = {it["price"]["id"]: it for it in current_items}
    desired_by_price = {d["price"]: d for d in desired_items}

    # 1) Update / Create
    for price_id, d in desired_by_price.items():
        if price_id in by_price:
            item = by_price[price_id]
            old_qty = int(item["quantity"])
            new_qty = int(d["quantity"])
            if old_qty != new_qty:
                stripe.SubscriptionItem.modify(
                    item["id"],
                    quantity=new_qty,
                    proration_behavior="create_prorations",
                )
        else:
            stripe.SubscriptionItem.create(
                subscription=sub.stripe_subscription_id,
                price=price_id,
                quantity=int(d["quantity"]),
                proration_behavior="create_prorations",
            )

    # 2) Delete items that are not desired anymore
    for price_id, item in by_price.items():
        if price_id not in desired_by_price:
            stripe.SubscriptionItem.delete(
                item["id"],
                params={"proration_behavior": "create_prorations"},
            )

    # Rafraîchir et enregistrer l'état local
    refreshed = stripe.Subscription.retrieve(sub.stripe_subscription_id)
    sub.stripe_status = refreshed["status"]
    sub.cancel_at_period_end = bool(refreshed.get("cancel_at_period_end"))
    sub.current_period_start = _dt_from_ts(refreshed.get("current_period_start"))
    sub.current_period_end = _dt_from_ts(refreshed.get("current_period_end"))
    sub.save(update_fields=["stripe_status", "cancel_at_period_end",
                            "current_period_start", "current_period_end"])
    return sub


def sync_subscription_from_stripe(subscription_id: str) -> Subscription | None:
    """
    Utilitaire pour le webhook: met à jour les champs locaux à partir d'un
    stripe.Subscription (dates, statut). Ne touche pas aux quantités.
    """
    try:
        s = stripe.Subscription.retrieve(subscription_id)
    except Exception as e:
        logger.error("sync_subscription_from_stripe: retrieve error: %s", e)
        return None

    try:
        cust = stripe.Customer.retrieve(s["customer"])
        office_id = cust.get("metadata", {}).get("office_id")
        if not office_id:
            logger.warning("sync_subscription_from_stripe: office_id absent dans customer.metadata")
            return None

        sub, _ = Subscription.objects.get_or_create(office_id=int(office_id))
        sub.stripe_customer_id = s["customer"]
        sub.stripe_subscription_id = s["id"]
        sub.stripe_status = s["status"]
        sub.cancel_at_period_end = bool(s.get("cancel_at_period_end"))
        sub.current_period_start = _dt_from_ts(s.get("current_period_start"))
        sub.current_period_end = _dt_from_ts(s.get("current_period_end"))
        sub.save()
        return sub
    except Exception as e:
        logger.error("sync_subscription_from_stripe: local save error: %s", e)
        return None
