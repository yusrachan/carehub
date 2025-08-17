import stripe
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.http import JsonResponse

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes

from .models import Office
from .serializers import OfficeSerializer
from accounts.models import UserOfficeRole

stripe.api_key = settings.STRIPE_SECRET_KEY
PLAN_PRICING = [('role_based', 'Basé sur rôle')]

class OfficeViewSet(viewsets.ModelViewSet):
    """
    CRUD sur cabinets en restreignant la liste aux cabinets liés à l'utilisateur courant
    """
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Office.objects.all()
        return Office.objects.filter(userofficerole__user=user).distinct()

    
class MyOffices(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Renvoie la liste des cabinets liés à l'utilisateur.
        """
        qs = (Office.objects.filter(userofficerole__user=request.user).values('id', 'name', 'userofficerole__role').order_by('name'))
        data = [
            {"id": row["id"], "name": row["name"], "role": row["userofficerole__role"]}
            for row in qs
        ]
        return Response(data)