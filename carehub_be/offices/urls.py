from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OfficeViewSet, MyOffices

router = DefaultRouter()
router.register(r'', OfficeViewSet, basename='office')

urlpatterns = [
    path('my/', MyOffices.as_view(), name='my_offices'),
    path('', include(router.urls)),
]