from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, download_invoice, mark_paid

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
    path('invoices/<int:pk>/mark-paid/', mark_paid, name='mark-paid'),
    path('invoices/<int:pk>/download/', download_invoice, name='invoice-download'),
]