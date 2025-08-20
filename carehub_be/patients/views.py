from django.shortcuts import render
from django.conf import settings
from django.utils import timezone
from django.db.models import Q

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.models import UserOfficeRole
from offices.models import Office
from .models import Patient
from .serializers import PatientSerializer

def _current_office(request):
    office_id = request.headers.get("X-Office-Id")
    if office_id:
        return Office.objects.filter(id=office_id).first()
    
    rel = (UserOfficeRole.objects.filter(user=request.user).select_related("office").first())

    return rel.office if rel else None

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    queryset = Patient.objects.all()

    def get_queryset(self):
        user = self.request.user
        office = _current_office(self.request)

        if not office:
            return Patient.objects.none()
        
        qs = Patient.objects.filter(office=office, is_deleted=False)

        roles = set(UserOfficeRole.objects.filter(user=user, office=office).values_list("role", flat=True))
        if "manager" in roles or "secretary" in roles:
            pass
        else:
            own = qs.filter(agenda__practitioner=user)
            authorized = qs.filter(patientaccess__practitioner=user, patientaccess__granted_by_patient=True)
            qs = (own | authorized).distinct()
        
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q) |
                Q(surname__icontains=q) |
                Q(email__icontains=q) |
                Q(telephone__icontains=q) |
                Q(city__icontains=q)
            )

        status_ = self.request.query_params.get("status")
        if status_ == "active":
            qs = qs.filter(is_deleted=False)
        elif status_ == "inactive":
            qs = Patient.objects.filter(office=office, is_deleted=True)
        
        tiers = self.request.query_params.get("tiers")
        if tiers in {"true", "false"}:
            qs = qs.filter(is_tiers_payant=(tiers == "true"))

        return qs.order_by("surname", "name")
    
    def perform_create(self, serializer):
        office = _current_office(self.request)
        if not office:
            return Response({"detail": "Cabinet introuvable."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer.save(office=office)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Patient create validation errors: ", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        return Response(serializer.errors, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        patient = self.get_object()
        patient.is_deleted = True
        patient.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)      
            
    @action(detail=True, methods=['delete'], url_path='force-delete')
    def force_delete_patient(self, request, pk=None):
        patient = self.get_object()
        if not patient.can_be_removed():
            retention_years = getattr(settings, 'DATA_RETENTION_YEARS', 30)
            allowed_date = patient.last_contact_date + timezone.timedelta(days=365 * retention_years)
            return Response({'detail': 'Patient cannot be deleted before {allowed_date.strftime("%d/%m/%Y")}.'}, status=status.HTTP_400_BAD_REQUEST)
        
        patient.delete()
        return Response({'detail': 'Patient deleted.'}, status=status.HTTP_204_NO_CONTENT)