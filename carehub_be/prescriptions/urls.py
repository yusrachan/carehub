from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrescriptionViewSet, PricingCalculationView

router = DefaultRouter()
router.register(r'prescriptions', PrescriptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('calculate-pricing/', PricingCalculationView.as_view(), name='calculate-pricing'),
]