from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccessGuard, CheckoutStart, CreateCheckoutSession, CreatePortalSession, StripeWebhook, SubscriptionStatus


urlpatterns = [
    path('offices/<uuid:office_id>/checkout/', CreateCheckoutSession.as_view()),
    path('offices/<uuid:office_id>/portal/', CreatePortalSession.as_view()),
    path('stripe/webhook/', StripeWebhook.as_view()),
    path("subscriptions/guard/", AccessGuard.as_view(), name="subscriptions_guard"),
    path("status/", SubscriptionStatus.as_view(), name="subscription_status"),
    path("checkout/start/", CheckoutStart.as_view(), name="subscription_checkout_start"),
]