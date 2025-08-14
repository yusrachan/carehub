from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, CreateInvoiceView, download_invoice, mark_paid

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
    path('create-invoice/', CreateInvoiceView.as_view(), name='create-invoice'),
    path('<int:pk>/mark-paid/', mark_paid, name='mark-paid'),
    path('<int:pk>/download/', download_invoice, name='download-invoice'),
]