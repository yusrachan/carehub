import datetime
import stripe

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserOfficeRole
from .services import ensure_subscription_matches_roles
from .utils import office_has_active_access
from offices.models import Office
from .models import Subscription

stripe.api_key = settings.STRIPE_SECRET_KEY

def seats_for_office(office_id):
    return UserOfficeRole.objects.filter(office_id=office_id, is_active=True).count() or 1

def get_price_id_from_plan(plan: str) -> str | None:
    return settings.STRIPE_PRICES.get(plan)

class CreateCheckoutSession(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, office_id):
        office = Office.objects.get(id=office_id)
        sub, _ = Subscription.objects.get_or_create(office=office)

        plan = (request.data.get("plan") or sub.plan or office.plan or "Small_Cab")
        price_id = get_price_id_from_plan(plan)
        if not price_id:
            return JsonResponse({"detail": "Plan inconnu ou non configuré."}, status=400)
        
        customer_id = sub.stripe_customer_id
        if not customer_id:
            customer = stripe.Customer.create(
                email=request.user.email,
                metadata={'office_id': str(office_id)}
            )
            customer_id = customer.id
            sub.stripe_customer_id = customer_id
            sub.plan = plan
            sub.save(update_fields=['stripe_customer_id', "plan"])

        success_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/settings?checkout=success",
        cancel_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/settings?checkout=cancel",

        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=sub.stripe_customer_id or stripe.Customer.create(
                email=request.user.email, metadata={'office_id': str(office_id)}
            ).id,
            line_items=[{"price": price_id, "quantity": 1}],
            allow_promotion_codes=True,
            success_url=success_url,
            cancel_url=cancel_url,
        )

        if not sub.stripe_customer_id:
            sub.stripe_customer_id = session.customer
        sub.plan = plan
        sub.save(update_fields=['plan', 'stripe_customer_id'])

        return JsonResponse({'url': session.url})

class CreatePortalSession(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, office_id):
        sub = Subscription.objects.get(office_id=office_id)
        session = stripe.billing_portal.Session.create(
            customer=sub.stripe_customer_id,
            return_url=f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/settings",
        )
        return JsonResponse({'url': session.url})

@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhook(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = request.body.decode("utf-8")
        sig = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig,
                secret=settings.STRIPE_WEBHOOK_SECRET,
            )
        except Exception as e:
            print("Webhook signature error: ", e)
            return HttpResponse(status=400)
        
        etype = event['type']
        data = event['data']['object']

        PRICE_TO_PLAN = {
            get_price_id_from_plan("Small_Cab"): "Small_Cab",
            get_price_id_from_plan("Medium_Cab"): "Medium_Cab",
            get_price_id_from_plan("Big_Cab"): "Big_Cab",
        }

        def _sync_from_subscription(s):
            cust = stripe.Customer.retrieve(s.customer)
            office_id = cust.metadata.get('office_id')
            if not office_id:
                return
            
            sub, _ = Subscription.objects.get_or_create(office_id=office_id)
            sub.stripe_customer_id = s.customer
            sub.stripe_subscription_id = s.id
            sub.stripe_status = s.status
            sub.quantity = s.items.data[0].quantity
            sub.cancel_at_period_end = bool(s.cancel_at_period_end)
            sub.start_date = datetime.date.fromtimestamp(s.current_period_start)
            sub.end_date = datetime.date.fromtimestamp(s.current_period_end)

            price = s.items.data[0].price
            sub.stripe_price_id = price.id
            if getattr(price, 'unit_amount', None) is not None:
                sub.price = (price.unit_amount or 0) / 100
                sub.currency = price.currency or 'eur'

            PRICE_TO_PLAN = {v:k for k,v in settings.STRIPE_PRICES.items()}
            plan = PRICE_TO_PLAN.get(price.id)
            if plan:
                sub.plan = plan
                try:
                    office = sub.office
                    if hasattr(office, "plan"):
                        office.save(update_fields=['plan'])
                except Exception:
                    pass
        
        try:
            if etype == 'checkout.session.completed':
                sub_id = data.get('subscription')
                if sub_id:
                    s = stripe.Subscription.retrieve(sub_id)
                    _sync_from_subscription(s)
            
            elif etype in (
                "customer.subscription.created",
                "customer.subscription.updated",
                "customer.subscription.deleted",):
                s = stripe.Subscription.retrieve(data.get("id"))
                _sync_from_subscription(s)
        
            elif etype in ('invoice.paid', "invoice.payment_failed"):
                    sub_id = data.get('subscription') 
                    if sub_id:
                        s = stripe.Subscription.retrieve(sub_id)
                        _sync_from_subscription(s)
        
        except Exception as e:
            print("Webhook handling error: ", e)
            return HttpResponse(status=200)
        
        return HttpResponse(status=200)

class AccessGuard(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(status=204)

class SubscriptionStatus(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1) essaie via l’en-tête X-Office-Id
        office_id = request.headers.get("X-Office-Id")
        office = None
        if office_id:
            office = Office.objects.filter(id=office_id).first()

        # 2) sinon, prends le premier cabinet du user
        if not office:
            rel = UserOfficeRole.objects.filter(user=request.user).order_by("id").first()
            office = rel.office if rel else None

        if not office:
            # Pas de cabinet = pas d’accès
            return Response({"is_active": False, "office_id": None, "office_name": None})

        return Response({
            "is_active": office_has_active_access(office),
            "office_id": office.id,
            "office_name": office.name,
        })
    
class CheckoutStart(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        office_id = request.headers.get("X-Office-Id") or (UserOfficeRole.objects.filter(user=request.user).values_list("office_id", flat=True).first())
        if not office_id:
            return Response({"error": "no_office"}, status=400)
        
        try:
            office = Office.objects.get(id=office_id)
        except Office.DoesNotExist:
            return Response({"error": "office_not_found"}, status=404)
        
        res = ensure_subscription_matches_roles(office, request.user.email, create_checkout_if_needed=True,)
        if isinstance(res, dict) and res.get("checkout_url"):
            return Response({"checkout_url" : res["checkout_url"]}, status=200)
        
        return Response({"error": "already_active"}, status=400)