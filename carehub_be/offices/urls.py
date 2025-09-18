from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OfficeViewSet, MyOffices, archive_office, unarchive_office

router = DefaultRouter()
router.register(r'', OfficeViewSet, basename='office')

urlpatterns = [
    path('my/', MyOffices.as_view(), name='my_offices'),
    path("<int:office_id>/archive/", archive_office, name="office-archive"),
    path("<int:office_id>/unarchive/", unarchive_office, name="office-unarchive"),
    path('', include(router.urls)),
]