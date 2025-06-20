from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ProfileView, LogoutView, MeView, register_user, RegisterFullAccount

urlpatterns = [
    path('register/', register_user, name='register_user'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register-full-account/', RegisterFullAccount.as_view(), name='register_full_account'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
]