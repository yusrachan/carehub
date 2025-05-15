from django.shortcuts import render
from billing.models import PathologyDetail
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Prescription, Patient
from .serializers import PrescriptionSerializer
from .utils import get_session_number

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

class PricingCalculationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_id = request.data.get('patient_id')
        category_code = request.data.get('pathology_category')
        is_bim = request.data.get('is_bim', False)

        if not patient_id or not category_code:
            return Response({"error": "patient_id et pathology_category sont requis."}, status=400)
        
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({"error": "Patient introuvable."}, status=404)
        
        nb_sessions = patient.appointments.filter(prescription__pathology_category=category_code).count()
        session_number = get_session_number(category_code, nb_sessions)
        is_first_session = (session_number == '1ère')

        
        try:
            pathology_detail = PathologyDetail.objects.get(
                category__code=category_code,
                session_number=session_number
            )
        except PathologyDetail.DoesNotExist:
            return Response({"error": "Données tarifaires non trouvées pour cette session."}, status=404)

        honoraires_total = pathology_detail.honoraire_presta or 0
        if is_first_session:
            honoraires_total += pathology_detail.honoraire_dossier or 0
        if pathology_detail.honoraire_depla:
            honoraires_total += pathology_detail.honoraire_depla

        return Response({
            "code_prestation": pathology_detail.code_presta,
            "code_dossier": pathology_detail.code_dossier if is_first_session else None,
            "honoraires_total": honoraires_total,
            "remboursement": pathology_detail.reimbursement_bim if is_bim else pathology_detail.reimbursement_non_bim,
            "tiers_payant": pathology_detail.tm_bim if is_bim else pathology_detail.tm_not_bim,
        })