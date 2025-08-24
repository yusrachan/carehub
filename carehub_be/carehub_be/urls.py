from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import PractitionersList, RegisterView

urlpatterns = [
    path('api/', include('accounts.urls')),
    path('api/', include('patients.urls')),
    path('api/', include('billing.urls')),
    path('api/', include('invoices.urls')),

    path('admin/', admin.site.urls),
    path('register/', RegisterView.as_view(), name='register'),
    # path('register-office/', register_office, name='register_office'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/offices/', include('offices.urls')),
    path('api/agenda/', include('agenda.urls')),
    path('api/practitioners/', PractitionersList.as_view()),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/prescriptions/', include('prescriptions.urls')),
    path('api/settings/', include('user_settings.urls')),
]
