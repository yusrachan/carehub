from django.shortcuts import render
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Patient.objects.filter(is_deleted=False)
    
    @action(detail=True, methods=['delete'], url_path='force-delete')
    def force_delete_patient(self, request, pk=None):
        patient = self.get_object()
        if not patient.can_be_removed():
            retention_years = getattr(settings, 'DATA_RETENTION_YEARS', 30)
            allowed_date = patient.last_contact_date + timezone.timedelta(days=365 * retention_years)
            return Response({'detail': 'Patient cannot be deleted before {allowed_date.strftime("%d/%m/%Y")}.'},
                            status=status.HTTP_400_BAD_REQUEST)
        patient.delete()
        return Response({'detail': 'Patient deleted.'}, status=status.HTTP_204_NO_CONTENT)