from rest_framework import viewsets, permissions
from billing.models import PathologyCategory
from .serializers import PathologyCategorySerializer

class PathologyCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PathologyCategory.objects.all().order_by("code")
    serializer_class = PathologyCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
