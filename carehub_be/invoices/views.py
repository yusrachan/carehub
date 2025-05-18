from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Invoice
from patients.models import Patient
from appointments.models import Appointment
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

class CreateInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient_id = request.data.get('patient_id')
        appointment_ids = request.data.get('appointment_ids', [])
        due_date = request.data.get('due_date')
        practitioner = request.user

        if not patient_id or not appointment_ids or not due_date:
            return Response({"error": "patient_id, appointment_ids, et due_date sont requis."}, status=400)
        
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({"error": "Patient introuvable."}, status=404)
        
        appointments = Appointment.objects.filter(id__in=appointment_ids, patient=patient)

        if not appointments.exists():
            return Response({"error": "No valid appointments found for this patient."}, status=404)

        invoice = Invoice.objects.create(
            patient=patient,
            practitioner=practitioner,
            due_date=due_date
        )
        invoice.appointments.set(appointments)
        invoice.calculate_total_amount()
        invoice.save()

        return Response({
            "invoice_id": invoice.id,
            "reference_number": invoice.reference_number,
            "total_amount": invoice.amount,
            "state": invoice.state
        }, status=201)