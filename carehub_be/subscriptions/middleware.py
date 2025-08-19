from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.models import UserOfficeRole
from offices.models import Office
from .utils import office_has_active_access
from .services import ensure_subscription_matches_roles

WHITELIST_PATH_PREFIXES = (
    "/api/auth/",
    "/api/register",
    "/api/settings/me",
    "/api/offices/my",
    "/api/subscriptions/stripe/webhook",
    "/api/subscriptions/checkout/",
    "/api/subscriptions/checkout/start/",
    "/api/subscriptions/portal",
    "/api/subscriptions/status",
)

class SubscriptionGateMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        if request.method == "OPTIONS":
            return None
        if not request.path.startswith("/api/"):
            return None
        # Authentifier le JWT ici
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            try:
                auth = JWTAuthentication().authenticate(request)
                res = auth.authenticate(request)
                if res:
                    request.user, request.auth = res
                    user = request.user
            except Exception:
                user = None
        
        if not user or not getattr(user, "is_authenticated", False):
            return None
        
        for prefix in WHITELIST_PATH_PREFIXES:
            if request.path.startswith(prefix):
                return None

        # Trouver le cabinet courant
        office_id = request.headers.get("X-Office-Id")
        office = Office.objects.filter(id=office_id).first() if office_id else None
        if not office:
            rel = UserOfficeRole.objects.filter(user_id=user.id).order_by("id").first()
            office = rel.office if rel else None
        if not office:
            return JsonResponse({"detail": "Cabinet introuvable."}, status=403)

        # Paywall si pas actif
        if office_has_active_access(office):
            return None

        payload = {
            "detail": "payment_required",
            "office_id": office.id,
            "office_name": office.name,
        }
        try:
            res = ensure_subscription_matches_roles(
                office, user.email, create_checkout_if_needed=True
            )
            if isinstance(res, dict) and res.get("checkout_url"):
                payload["checkout_url"] = res["checkout_url"]
        except Exception:
            pass

        return JsonResponse(payload, status=402)
