from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreateCheckoutSession, CreatePortalSession, StripeWebhook


urlpatterns = [
    path('offices/<uuid:office_id>/checkout/', CreateCheckoutSession.as_view()),
    path('offices/<uuid:office_id>/portal/', CreatePortalSession.as_view()),
    path('stripe/webhook/', StripeWebhook.as_view()),
]