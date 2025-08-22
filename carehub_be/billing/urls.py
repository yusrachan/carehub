from rest_framework.routers import DefaultRouter
from .views import PathologyCategoryViewSet

router = DefaultRouter()
router.register(r'pathology-categories', PathologyCategoryViewSet, basename='pathology-category')
urlpatterns = router.urls
