from datetime import timedelta
from decimal import Decimal
from django.utils import timezone

CANCEL_FEE = Decimal("25.00")
VALID_REASONS = {"death", "sick_with_note", "first_cancellation"}

def within_24h(app_dt, now=None):
    now = now or timezone.now()
    return (app_dt - now) <= timedelta(hours=24)

def compute_amount_and_description(appointments, cancel_reason=None):
    """
    Retourne (amount: Decimal, description: str).
    Règles:
      - completed  -> total = somme des honoraires_total des RDV
      - cancelled <24h sans raison valable -> 25€
      - no_show -> 25€
      - cancelled >=24h ou <24h avec raison valable -> 0€
      - plusieurs RDV -> somme des honoraires_total
    """
    if not appointments:
        return (Decimal("0.00"), "Aucun rendez-vous")

    # 1 RDV
    if len(appointments) == 1:
        a = appointments[0]
        status = (a.status or "").lower()

        if status == "completed":
            # On facture la séance
            return (Decimal(a.honoraires_total or 0), f"Séance {a.code_prestation or ''}".strip())

        if status == "no_show":
            return (CANCEL_FEE, "Frais absence (no-show)")

        if status == "cancelled":
            if within_24h(a.app_date) and (cancel_reason not in VALID_REASONS):
                return (CANCEL_FEE, "Frais d’annulation (<24h)")
            else:
                return (Decimal("0.00"), "Annulation sans frais")

        # scheduled / delay -> rien
        return (Decimal("0.00"), "Aucune facturation")

    # Plusieurs RDV: on somme les honoraires_total
    total = sum(Decimal(a.honoraires_total or 0) for a in appointments)
    return (total, "Séances (multi)")