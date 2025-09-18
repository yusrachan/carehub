from .models import AuditEvent
from .middleware import get_current_request, get_current_user

def client_ip(request):
    if not request:
        return None
    
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    
    return request.META.get("REMOTE_ADDR")

def log_audit(event_type: str, *, target_user=None, target_office_id=None, office_context_id=None, reason: str = "", before: dict | None = None, after: dict | None = None):
    """
    Création d'un AuditEvent avec contexte HTTP si dispo.
    """

    req = get_current_request()
    actor = get_current_user()

    ae = AuditEvent.objects.create(
        event_type=event_type,
        actor=actor if actor and actor.is_authenticated else None,
        target_user=target_user,
        target_office_id=target_office_id,
        office_context_id=office_context_id,
        path=(req.path if req else ""),
        ip_address=client_ip(req),
        user_agent=(req.META.get("HTTP_USER_AGENT") if req else ""),
        request_id=(getattr(req, "request_id", "") if req else ""),
        reason=reason or "",
        before=before,
        after=after,
    )

    return ae