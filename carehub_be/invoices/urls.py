from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, CreateInvoiceView

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
    path('create-invoice/', CreateInvoiceView.as_view(), name='create-invoice'),
]