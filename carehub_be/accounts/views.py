"""
Views et API endpoints pour la gestion des utilisateurs et cabinets sur CareHub.

Contient :
- Inscription d'utilisateurs et cabinets
- Gestion des rôles dans les cabinets
- Invitations à rejoindre un cabinet
- Activation / désactivation de comptes et rôles
- Vérifications d'unicité (email, INAMI, BCE)
"""

from datetime import timedelta

from django.conf import settings
from django.shortcuts import render
from django.core.mail import send_mail
from django.core.exceptions import FieldDoesNotExist
from django.utils import timezone
from django.db import transaction
from django.db.models import Q

from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken

import stripe
from auditing.utils import log_audit
from subscriptions.services import ensure_subscription_matches_roles
from subscriptions.models import Subscription
from offices.models import Office
from .models import Invitation, User, UserOfficeRole
from .serializers import PractitionerLiteSerializer, RegisterSerializer, UserSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY
FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
ALLOWED_ROLES = {"manager", "practitioner", "secretary"}

def _is_manager(user, office_id):
    """
    Vérifie si l'utilisateur est manager d'un cabinet donné.
    """
    return UserOfficeRole.objects.filter(user=user, office_id=office_id, role="manager").exists()

class RegisterView(generics.CreateAPIView):
    """
    Endpoint pour créer un nouvel utilisateur.
    Retourne tokens JWT après création.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        """
        Crée l'utilisateur et génère les tokens JWT.
        """

        response = super().create(request, *args, **kwargs)
        user = User.objects.get(email=request.data['email'])
        refresh = RefreshToken.for_user(user)
        response.data['refresh'] = str(refresh)
        response.data['access'] = str(refresh.access_token)
        return response

class ProfileView(APIView):
    """
    Récupère le profil de l'utilisateur connecté.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "name": user.name,
            "surname": user.surname,
        })

class LogoutView(APIView):
    """
    Déconnecte un utilisateur en blacklistant le refresh token.
    """

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
    """
    Renvoie les données sérialisées de l'utilisateur connecté.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
class RegisterFullAccount(APIView):
    """
    Crée un utilisateur complet avec son cabinet.
    Vérifie l'unicité de l'email, BCE, INAMI, NISS.
    Attribue le rôle 'manager' à l'utilisateur pour le cabinet créé.
    """
     
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        """
        Endpoint POST pour l'inscription complète.
        Retourne tokens JWT et, si nécessaire, un lien de paiement Stripe.
        """

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
    """
    Vérifie si un numéro INAMI existe dans la base.
    Retourne existence et infos de l'utilisateur si trouvé.
    """

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
    """
    Crée un utilisateur simple à partir de l'email et mot de passe.
    """

    data = request.data
    if User.objects.filter(email=data['email']).exists():
        return Response({'email': 'E-mail déjà utilisé.'}, status=400)
    
    user = User.objects.create_user(
        username=data['email'],
        email=data['email'],
        password=data['password'],
    )
    return Response({'message': 'Utilisateur créé avec succès.'}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_user(request):
    """
    Invite kiné (INAMI) OU secrétaire/manager (email).
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
    """
    Retourne les informations d'une invitation à partir de son token.
    """

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
    """
    Inscription d'un utilisateur à partir d'une invitation.
    Crée l'utilisateur si nécessaire et assigne le rôle dans le cabinet.
    """

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
    """
    Retourne la liste des membres d'un cabinet (filtrage par rôle actif si existant).
    """

    if not UserOfficeRole.objects.filter(user=request.user, office_id=office_id).exists():
        return Response({"detail": "Forbidden"}, status=403)

    qs = UserOfficeRole.objects.select_related("user").filter(office_id=office_id)

    try:
        UserOfficeRole._meta.get_field("is_active")
        qs = qs.filter(is_active=True)
    except FieldDoesNotExist:
        pass

    members = []
    for uor in qs:
        u = uor.user
        members.append({
            "id": u.id,
            "email": u.email,
            "name": u.name or "",
            "surname": u.surname or "",
            "role": uor.role,
        })

    return Response(members)

class PractitionersList(APIView):
    """
    Liste les praticiens, filtrable par cabinet et recherche texte.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # office via header ou paramètre
        office_id = request.headers.get("X-Office-Id") or request.query_params.get("office")
        qs = User.objects.all()

        qs = qs.filter(userofficerole__role="practitioner").distinct()

        if office_id:
            qs = qs.filter(userofficerole__office_id=office_id)

        q = request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(name__icontains=q) |
                Q(surname__icontains=q) |
                Q(username__icontains=q)
            )

        data = PractitionerLiteSerializer(qs.order_by("surname","name"), many=True).data
        return Response(data)

def _user_is_manager_of_office(user, office_id: int) -> bool:
    """
    Vérifie si un utilisateur est manager actif d'un cabinet donné.
    """
    return UserOfficeRole.objects.filter(user=user, office_id=office_id, role="manager", is_active=True).exists()

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def deactivate_user_global(request):
    """
    Désactive le compte d'un utilisateur
    Conditions: superuser ou manager d'au moins un office partageant un rôle actif avec la cible.
    """

    actor = request.user
    user_id = request.data.get("user_id")
    reason = (request.data.get("reason") or "").strip()
    target = User.objects.filter(pk=user_id).first()

    if not target.is_active:
        return Response({"detail": "Utilisateur introuvable"}, status=404)
    target.is_active = False
    
    if not actor.is_superuser:
        shared_offices = UserOfficeRole.objects.filter(
            user=target, is_active=True, office_id=UserOfficeRole.objects.filter(
                user=actor, role="manager", is_active=True
            ).values_list("office_id", flat=True)
        ).exists()
        
        if not shared_offices:
            return Response({"detail": "Interdit"}, status=403)
    
    if target.is_active:
        return Response({"detail": "Déjà désactivé"}, status=409)
        
    before = {"is_active": target.is_active}
    target.is_active = False
    target.save(update_fields=["is_active"])
    after = {"is_active": target.is_active}

    log_audit("USER_DEACTIVATED", target_user=target, reason=reason, before=before, after=after)

    return Response({"message": "Utilisateur désactivé."}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def reactivate_user_global(request):
    """
    Réactive un compte.
    """

    actor = request.user
    user_id = request.data.get("user_id")
    reason = (request.data.get("reason") or "").strip()
    target = User.objects.filter(pk=user_id).first()
    shared_offices = True

    if not target:
        return Response({"detail": "Utilisateur introuvable"}, status=404)
    
    if not actor.is_superuser:
        shared_offices = UserOfficeRole.objects.filter(
            user=target,
            is_active=True,
            office_id=UserOfficeRole.objects.filter(
                user=actor, role="manager", is_active=True
            ).values_list("office_id", flat=True)
        ).exists()
        
    if not shared_offices:
        return Response({"detail": "Interdit"}, status=403)
    
    if target.is_active:
            return Response({"detail": "Déjà actif"}, status=409)
        
    before = {"is_active": target.is_active}
    target.is_active = True
    target.save(update_fields=["is_active"])
    after = {"is_active": target.is_active}

    log_audit("USER_REACTIVATED", target_user=target, reason=reason, before=before, after=after)

    return Response({"message": "Utilisateur réactivé."}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def revoke_role(request):
    """
    Désactive un rôle d'un utilisateur dans un cabinet.
    """

    actor = request.user
    user_id = request.data.get("user_id")
    office_id = request.data.get("office_id")
    role = (request.data.get("role") or "").strip()
    reason = (request.data.get("reason") or "").strip()

    if not _user_is_manager_of_office(actor, office_id):
        return Response({"detail": "Interdit"}, status=403)
    
    uor = UserOfficeRole.objects.filter(user_id=user_id, office_id=office_id, role=role).first()
    if not uor:
        return Response({"detail": "Rôle introuvable"}, status=404)
    if not uor.is_active:
        return Response({"detail": "Rôle déjà inactif"}, status=409)
    
    before = {"is_active": uor.is_active}
    uor.is_active = False
    uor.save(update_fields=["is_active"])
    after = {"is_active": uor.is_active}

    log_audit( "ROLE_REVOKED", target_user=uor.user, target_office_id=office_id, office_context_id=office_id, reason=reason, before=before, after=after,)

    return Response({"message": "Rôle désactivé pour ce cabinet."}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def grant_role(request):
    """
    (ré)active un rôle d'un utilisateur dans un cabinet
    """

    actor = request.user
    user_id = request.data.get("user_id")
    office_id = request.data.get("office_id")
    role = (request.data.get("role") or "").strip()
    reason = (request.data.get("reason") or "").strip()

    if not _user_is_manager_of_office(actor, office_id):
        return Response({"detail": "Interdit"}, status=403)

    uor = UserOfficeRole.objects.filter(user_id=user_id, office_id=office_id).first()

    if uor:
        if uor.is_active and uor.role == role:
            return Response({"detail": "Rôle déjà actif"}, status=409)
        
    
        before = {"is_active": uor.is_active, "role": uor.role}
        uor.role = role
        uor.is_active = True
        uor.save(update_fields=["is_active"])
        after = {"is_active": uor.is_active, "role": uor.role}
    
    else:
        uor = UserOfficeRole.objects.create(
            user_id=user_id,
            office_id=office_id,
            role=role,
            is_active=True,
        )
        before = None
        after = {"is_active": uor.is_active, "role": uor.role}
    
    try:
        log_audit("ROLE_GRANTED", target_user=uor.user, target_office_id=office_id, office_context_id=office_id, reason=reason, before=before, after=after,)
    except Exception:
        pass

    return Response({"message": "Rôle (ré)activé pour ce cabinet."}, status=200)