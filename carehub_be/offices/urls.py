from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OfficeViewSet

router = DefaultRouter()
router.register(r'', OfficeViewSet, basename='office')

urlpatterns = [
    path('', include(router.urls))
]