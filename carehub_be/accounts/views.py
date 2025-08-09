import uuid
from django.shortcuts import render
from django.core.mail import send_mail
from django.utils import timezone
from django.db import transaction
from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from offices.models import Office
from .models import Invitation, User, UserOfficeRole
from .serializers import RegisterSerializer, UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(email=request.data['email'])
        refresh = RefreshToken.for_user(user)
        response.data['refresh'] = str(refresh)
        response.data['access'] = str(refresh.access_token)
        return response

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "name": user.name,
            "surname": user.surname,
        })

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
class RegisterFullAccount(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        #Creation of User
        user = User.objects.create_user(
            email=data['email'],
            password=data['password'],
            name=data['name'],
            surname=data['surname'],
        )

        #Creation of Office
        office = Office.objects.create(
            name=data['office_name'],
            bce_number=data['bce_number'],
            street=data['street'],
            number_street=data['number_street'],
            box=data.get('box', ''),
            zipcode=data['zipcode'],
            city=data['city'],
            email=data['email'],
            plan=data['plan'],
        )

        #Créateur du cabinet est direct manager
        UserOfficeRole.objects.create(user=user, office=office, role='manager')

        refresh =  RefreshToken.for_user(user)
        return Response({'refresh': str(refresh), 'access': str(refresh.access_token)}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    if User.objects.filter(email=data['email']).exists():
        return Response({'email': 'E-mail déjà utilisé.'}, status=400)
    
    user = User.objects.create_user(
        username=data['email'],
        email=data['email'],
        password=data['password'],
    )
    return Response({'message': 'Utilisateur créé avec succès.'}, status=201)

#Vue pour inviter un collaborateur dans un cabinet par le manager
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_user(request):
    print("Authorization Header:", request.headers.get('Authorization'))
    try:
        user, token = JWTAuthentication().authenticate(request)
        print("JWT ok ! Utilisateur :", user)
    except Exception as e:
        print("Erreur JWT :", e)
        return Response({"error": "JWT invalide ou expiré"}, status=401)

    data = request.data
    email = data['email']
    office_id = data['office_id']
    role = data['role']
    name = data.get('name', '')
    surname = data.get('surname', '')
    expires_at = timezone.now() + timezone.timedelta(days=2)
    invitation = Invitation.objects.create(
        email=email,
        office_id=office_id,
        role=role,
        expires_at=expires_at,
        name=name,
        surname=surname
    )
    link = f"https://carehub.com/register-join?token={invitation.token}"
    send_mail(
        "Invitation à rejoindre un cabinet sur CareHub",
        f"Bonjour {name}, \n\nVous avez été invité(e) en tant que {role} au cabinet. Cliquez ici pour finaliser votre inscription : {link}\n\nCe lien est valable 2 jours.",
        "no-reply@carehub.com",
        [email]
    )
    return Response({"message": "Invitation envoyée."})

@api_view(['GET'])
@permission_classes([AllowAny])
def invitation_detail(request):
    token = request.GET.get('token')
    try:
        invitation = Invitation.objects.get(token=token, used=False, expires_at__gt=timezone.now())
        return Response({
            "email": invitation.email,
            "name": invitation.name,
            "surname": invitation.surname,
            "role": invitation.role,
        })
    except Invitation.DoesNotExist:
        return Response({"error": "Invitation invalide ou expirée."}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def register_join(request):
    data = request.data
    token = data['token']
    password = data.get('password', None)
    try:
        invitation = Invitation.objects.get(token=token, used=False, expires_at__gt=timezone.now())
    except Invitation.DoesNotExist:
        return Response({"error": "Lien d'invitation invalide ou expiré."}, status=400)
    
    try:
        user = User.objects.get(email=invitation.email)
    except User.DoesNotExist:
        if not password:
            return Response({"error": "Mot de passe requis."}, status=400)
        user = User.objects.create_user(
            email=invitation.email,
            password=password,
            name=invitation.name,
            surname=invitation.surname,
        )
    
    UserOfficeRole.objects.get_or_create(
        user=user,
        office=invitation.office,
        role=invitation.role,
    )
    invitation.used = True
    invitation.save()
    refresh = RefreshToken.for_user(user)
    return Response({'refresh': str(refresh), 'access': str(refresh.access_token)}, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def office_members(request, office_id):
    user_office_roles = UserOfficeRole.objects.filter(office_id=office_id)
    members = [
        {
            "email": uor.user.email,
            "name": uor.user.name,
            "surname": uor.user.surname,
            "role": uor.role,
        }
        for uor in user_office_roles
    ]
    return Response(members)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_inami(request):
    print("Authorization Header reçu check in:", request.headers.get("Authorization"))
    inami = request.GET.get('inami')
    exists = User.objects.filter(inami=inami).exists()
    user_data = None
    if exists:
        user = User.objects.get(inami=inami)
        user_data = {"name": user.name, "surname": user.surname, "email": user.email}
    return Response({"exists": exists, "user": user_data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_existing_user(request):
    inami = request.data.get('inami')
    office_id = request.data.get('office_id')
    role = request.data.get('role', 'practitioner')

    if not inami or not office_id:
        return Response({'error': 'INAMI et office_id requis'}, status=400)
    try:
        user = User.objects.get(inami=inami)
        office = Office.objects.get(id=office_id)
        if UserOfficeRole.objects.filter(user=user, office=office).exists():
            return Response({"error": "Ce collaborateur est déjà dans le cabinet."}, status=400)
        UserOfficeRole.objects.create(user=user, office=office, role=role)
        return Response({"message": "Invitation envoyée."})
    except User.DoesNotExist:
        return Response({"error": "Utilisateur non trouvé."}, status=404)
    except Office.DoesNotExist:
        return Response({"error": "Cabinet non trouvé"}, status=404)