from django.shortcuts import render
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from offices.models import Office
from .models import User, UserOfficeRole
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

        user = User.objects.create_user(
            email=data['email'],
            password=data['password'],
            name=data['name'],
            surname=data['surname'],
        )

        office = Office.objects.create(
            name=data['office_name'],
            bce_number=data['bce_number'],
            street=data['street'],
            number_street=data['number_street'],
            box=data['box'],
            zipcode=data['zipcode'],
            city=data['city'],
            plan=data['plan'],
        )

        UserOfficeRole.objects.create(user=user, office=office, role='manager')

        return Response({"message": "Inscription réussie"}, status=status.HTTP_201_CREATED)

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