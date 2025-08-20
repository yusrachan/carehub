from datetime import timedelta
from django.conf import settings
from django.shortcuts import render
from django.core.mail import send_mail
from django.core.exceptions import FieldDoesNotExist
from django.utils import timezone
from django.db import transaction
from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
import stripe
from subscriptions.services import ensure_subscription_matches_roles
from subscriptions.utils import can_activate_one_more
from subscriptions.models import Subscription
from offices.models import Office
from .models import Invitation, User, UserOfficeRole
from .serializers import RegisterSerializer, UserSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY
FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
ALLOWED_ROLES = {"manager", "practitioner", "secretary"}

def _is_manager(user, office_id):
    return UserOfficeRole.objects.filter(user=user, office_id=office_id, role="manager").exists()

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
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
class RegisterFullAccount(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        errors = {}
        if User.objects.filter(email=data['email']).exists():
                errors['email'] = "E-mail déjà utilisé."
        if data.get("inami") and User.objects.filter(inami=data['inami']).exists():
            errors['inami'] = "INAMI déjà utilisé."
        if data.get("niss") and User.objects.filter(niss=data['niss']).exists():
            errors['niss'] = "NISS déjà utilisé."

        if Office.objects.filter(bce_number=data['bce_number']).exists():
            errors['bce_number'] = "Numéro BCE déjà utilisé."
        if Office.objects.filter(email=data['email']).exists():
            errors['email'] = "E-mail déjà utilisé pour un cabinet."

        if errors:
            return Response(errors, status=400)
        
        #Creation of User
        user = User.objects.create_user(
            email=data['email'],
            password=data['password'],
            name=data['name'],
            surname=data['surname'],
            inami=data.get('inami'),
            niss=data.get('niss'),
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
            plan='role_based',
        )

        #Créateur du cabinet est direct manager
        UserOfficeRole.objects.create(user=user, office=office, role='manager')
        
        sync_res = ensure_subscription_matches_roles(office, user.email)
        refresh = RefreshToken.for_user(user)
        resp = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

        if isinstance(sync_res, dict) and sync_res.get("checkout_url"):
            resp["checkout_url"] = sync_res["checkout_url"]

        return Response(resp, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_inami(request):
    inami = (request.GET.get('inami') or "").strip()
    if not inami:
        return Response({"error": "Paramètre 'inami' requis"}, status=400)
    user = User.objects.filter(inami=inami).first()
    if not user:
        return Response({"exists": False, "user": None})
    return Response({"exists": True, "user": {"name": user.name, "surname": user.surname, "email": user.email}})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_secretary_email(request):
    """
    Vérifie si l'e-mail correspond déjà à un compte CareHub.
    """
    email = (request.GET.get('email') or "").strip()
    if not email:
        return Response({"error": "Paramètre 'email' requis."}, status=400)

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({"exists": False, "user": None})

    return Response({
        "exists": True,
        "user": {
            "name": user.name or "",
            "surname": user.surname or "",
            "email": user.email,
        }
    })

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

def _already_invited(email: str, office_id: int) -> bool:
    return Invitation.objects.filter(
        email__iexact=email,
        office_id=office_id,
        used=False,
        expires_at__gt=timezone.now()
    ).exists()

#Vue pour inviter un collaborateur dans un cabinet par le manager
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_user(request):
    """
    invite kiné (INAMI) OU secrétaire/manager (email).
    Corps attendu:
      - commun: office_id, role
      - practitioner: inami obligatoire ; si user introuvable => aussi email, name, surname
      - secretary/manager: email obligatoire ; si user introuvable => aussi name, surname
    """
    data = request.data

    office_id = data.get('office_id')
    role = (data.get('role') or '').strip()
    name = (data.get('name') or '').strip()
    surname = (data.get('surname') or '').strip()
    email = (data.get('email') or '').strip()
    inami = (data.get('inami') or '').strip()

    if not office_id or role not in ALLOWED_ROLES:
        return Response({"error": "Paramètres invalides."}, status=400)

    if not _is_manager(request.user, office_id):
        return Response({"error": "Action réservée aux managers du cabinet."}, status=403)

    def _already_invited(_email: str) -> bool:
        return Invitation.objects.filter(
            email__iexact=_email,
            office_id=office_id,
            used=False,
            expires_at__gt=timezone.now()
        ).exists()

    if inami:
        user = User.objects.filter(inami=inami).first()

        if user:
            if UserOfficeRole.objects.filter(user=user, office_id=office_id, role=role).exists():
                return Response({"error": "Cet utilisateur a déjà ce rôle dans le cabinet."}, status=409)
            if _already_invited(user.email):
                return Response({"error": "Une invitation en cours existe déjà pour cet utilisateur."}, status=409)

            expires_at = timezone.now() + timedelta(days=2)
            inv = Invitation.objects.create(
                email=user.email,
                office_id=office_id,
                role=role,
                name=user.name or "",
                surname=user.surname or "",
                expires_at=expires_at,
            )
            link = f"{settings.FRONTEND_URL}/register-join?token={inv.token}"
            send_mail(
                "Invitation à rejoindre un cabinet sur CareHub",
                f"Bonjour {user.name},\n\nVous avez été invité(e) en tant que {role}."
                f" Cliquez ici pour accepter : {link}\n\nLien valable 2 jours.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
            return Response({"message": "Invitation envoyée à un compte existant.", "invited_existing": True}, status=201)

        if not (email and name and surname):
            return Response({"not_found": True, "error": "Utilisateur INAMI introuvable. Fournis nom/prénom/e-mail pour inviter un nouveau compte."}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return Response({"error": "Un compte existe déjà avec cet e-mail. Utilise l’INAMI pour l’inviter."}, status=409)

        if _already_invited(email):
            return Response({"error": "Une invitation en cours existe déjà pour cet e-mail."}, status=409)

        expires_at = timezone.now() + timedelta(days=2)
        inv = Invitation.objects.create(
            email=email,
            office_id=office_id,
            role=role,
            name=name,
            surname=surname,
            expires_at=expires_at,
        )
        link = f"{settings.FRONTEND_URL}/register-join?token={inv.token}"
        send_mail(
            "Invitation à rejoindre un cabinet sur CareHub",
            f"Bonjour {name},\n\nVous avez été invité(e) en tant que {role}."
            f" Cliquez ici pour finaliser votre inscription : {link}\n\nLien valable 2 jours.",
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )
        return Response({"message": "Invitation envoyée."}, status=201)

    if not (email and name and surname):
        return Response({"error": "Nom, prénom et e-mail requis."}, status=400)

    if User.objects.filter(email__iexact=email).exists():
        if _already_invited(email):
            return Response({"error": "Une invitation en cours existe déjà pour cet utilisateur."}, status=409)

        expires_at = timezone.now() + timedelta(days=2)
        inv = Invitation.objects.create(
            email=email,
            office_id=office_id,
            role=role,
            name=name,
            surname=surname,
            expires_at=expires_at,
        )
        link = f"{settings.FRONTEND_URL}/register-join?token={inv.token}"
        send_mail(
            "Invitation à rejoindre un cabinet sur CareHub",
            f"Bonjour {name},\n\nVous avez été invité(e) en tant que {role}."
            f" Cliquez ici pour accepter : {link}\n\nLien valable 2 jours.",
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )
        return Response({"message": "Invitation envoyée à un compte existant."}, status=201)

    if _already_invited(email):
        return Response({"error": "Une invitation en cours existe déjà pour cet e-mail."}, status=409)

    expires_at = timezone.now() + timedelta(days=2)
    inv = Invitation.objects.create(
        email=email,
        office_id=office_id,
        role=role,
        name=name,
        surname=surname,
        expires_at=expires_at,
    )
    link = f"{settings.FRONTEND_URL}/register-join?token={inv.token}"
    send_mail(
        "Invitation à rejoindre un cabinet sur CareHub",
        f"Bonjour {name},\n\nVous avez été invité(e) en tant que {role}."
        f" Cliquez ici pour finaliser votre inscription : {link}\n\nLien valable 2 jours.",
        settings.DEFAULT_FROM_EMAIL,
        [email],
    )
    return Response({"message": "Invitation envoyée."}, status=201)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def invitation_detail(request):
    token = request.GET.get('token')
    try:
        invitation = Invitation.objects.get(token=token, used=False, expires_at__gt=timezone.now())
    except Invitation.DoesNotExist:
        return Response({"error": "Invitation invalide ou expirée."}, status=400)
    
    user_exists = User.objects.filter(email__iexact=invitation.email).exists()
    return Response({
        "email": invitation.email,
        "name": invitation.name,
        "surname": invitation.surname,
        "role": invitation.role,
        "office_id": invitation.office_id,
        "office_name": invitation.office.name,
        "user_exists": user_exists,
    })

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def register_join(request):
    data = request.data
    token = data.get('token')
    if not token:
        return Response({"error": "Token manquant."}, status=400)

    try:
        invitation = Invitation.objects.select_related('office').get(token=token, used=False, expires_at__gt=timezone.now())
    except Invitation.DoesNotExist:
        return Response({"error": "Lien d'invitation invalide ou expiré."}, status=400)

    user = User.objects.filter(email__iexact=invitation.email).first()
    if user is None:
        password = data.get('password')
        if not password:
            return Response({"error": "Mot de passe requis."}, status=400)
        user = User.objects.create_user(
            email=invitation.email,
            password=password,
            name=invitation.name or "",
            surname=invitation.surname or "",
        )

    UserOfficeRole.objects.get_or_create(
        user=user,
        office=invitation.office,
        role=invitation.role,
        defaults={"is_active": True},
    )

    invitation.used = True
    invitation.save(update_fields=["used"])

    ensure_subscription_matches_roles(invitation.office, invitation.email)

    refresh = RefreshToken.for_user(user)
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh)},
        status=status.HTTP_201_CREATED
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def office_members(request, office_id):
    # 1) L’utilisateur doit appartenir au cabinet
    if not UserOfficeRole.objects.filter(user=request.user, office_id=office_id).exists():
        return Response({"detail": "Forbidden"}, status=403)

    # 2) Charge les rôles + user sans N+1
    qs = UserOfficeRole.objects.select_related("user").filter(office_id=office_id)

    # 3) Si le champ is_active existe, ne renvoie que les liens actifs
    try:
        UserOfficeRole._meta.get_field("is_active")
        qs = qs.filter(is_active=True)
    except FieldDoesNotExist:
        pass

    # 4) Sérialise proprement
    members = []
    for uor in qs:
        u = uor.user
        members.append({
            "email": u.email,
            "name": u.name or "",
            "surname": u.surname or "",
            "role": uor.role,
        })

    return Response(members)