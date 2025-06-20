import stripe
import json
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from .models import Office
from .serializers import OfficeSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY
PLAN_PRICING = {
    'petit_cabinet': {'label': 'Petit cabinet (1 à 3 praticiens)', 'price': 3000},  # 30€
    'moyen_cabinet': {'label': 'Moyen cabinet (4 à 10 praticiens)', 'price': 7000},  # 70€
    'grand_cabinet': {'label': 'Grand cabinet (11+ praticiens)', 'price': 12000}, #120€
}

class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([AllowAny])
def register_office(request):
    data = request.data
    plan = request.data

    if plan not in PLAN_PRICING:
        return JsonResponse({'plan': 'Plan invalide.'}, status=404)
    
    if Office.objects.filter(email=data['email']).exists():
        return JsonResponse({'email': 'Email déjà utilisé.'}, status=400)
    if Office.objects.filter(bce_number=data['bce_number']).exists():
        return JsonResponse({'bce_number': 'Numéro BCE déjà utilisé.'}, status=400)
    if Office.objects.filter(phone=data['phone']).exists():
        return JsonResponse({'phone': 'Numéro de téléphone déjà utilisé.'}, status=400)
    
    office = Office.objects.create(
        name=data['name'],
        bce_number=data['bce_number'],
        street=data['street'],
        number_street=data['number_street'],
        box=data.get['box', ''],
        zipcode=data['zipcode'],
        email=data['email'],
        phone=data['phone'],
        name=data['name'],
        is_paid=False,
        registration_token=get_random_string(50)
    )

    plan_info = PLAN_PRICING[plan]

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f'Abonnement CareHub - {plan_info['label']}',
                        },
                        'unit_amount': plan_info['price'],
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=f"http://localhost:5173/success?token={office.registration_token}",
            cancel_url="http://localhost:5173/cancel",
            metadata={
                'office_id': office.id,
                'plan': plan,
            }
        )

        payment_link = checkout_session.url
    
        send_mail(
            subject="Finalisez votre inscription CareHub",
            message=f"Bonjour, merci de finaliser votre inscription via ce lien : {payment_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[office.email],
            fail_silently=False,
        )

        return JsonResponse({'message': "Inscription réussie. Vérifiez vos emails afin de finaliser l'inscription."}, status=201)
    
    except Exception as e:
        office.delete()
        return JsonResponse({'error': str(e)}, status=500)
    
# @csrf_exempt
# def stripe_webhook(request):
#     payload = request.body
#     sig_header = request.META['HTTP_STRIPE_SIGNATURE']
#     endpoint_secret = settings.STRIPE_WEBHOOK_SECRET