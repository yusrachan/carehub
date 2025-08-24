import datetime
from io import BytesIO
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action

from .models import Invoice
from .policy import compute_amount_and_description
from .serializers import InvoiceSerializer
from agenda.models import Agenda
from patients.models import Patient

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    lookup_value_regex = r'\d+'

    @action(detail=False, methods=['post'], url_path='create-from-appointments')
    def create_from_appointments(self, request):
        patient_id = request.data.get('patient_id')
        appointment_ids = request.data.get('appointment_ids', [])
        due_date = request.data.get('due_date')
        practitioner = request.user

        if not patient_id or not appointment_ids or not due_date:
            return Response({"error": "patient_id, appointment_ids et due_date sont requis."}, status=400)

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({"error": "Patient introuvable."}, status=404)

        appointments = Agenda.objects.filter(id__in=appointment_ids, patient=patient)
        if not appointments.exists():
            return Response({"error": "Aucun rendez-vous valide pour ce patient."}, status=404)
        
        invoice = Invoice(patient=patient, practitioner=practitioner, due_date=due_date, amount=0)
        invoice.save()

        invoice.agenda.set(appointments)

        invoice.calculate_total_amount()
        invoice.save(update_fields=['amount'])

        return Response({
            "invoice_id": invoice.id,
            "reference_number": invoice.reference_number,
            "total_amount": invoice.amount,
            "state": invoice.state
        }, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_paid(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    invoice.state = 'paid'
    invoice.paid_date = datetime.date.today()
    invoice.save(update_fields=['state', 'paid_date'])
    return Response({"status": "paid"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_invoice(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, f"Facture {invoice.reference_number}")
    c.setFont("Helvetica", 12)
    c.drawString(50, 770, f"Patient : {invoice.patient}")
    c.drawString(50, 750, f"Montant : {invoice.amount}€")
    c.drawString(50, 730, f"État : {invoice.state}")
    c.drawString(50, 710, f"Date d'émission : {invoice.sending_date}")
    c.drawString(50, 690, f"Date d'échéance : {invoice.due_date}")
    if invoice.paid_date:
        c.drawString(50, 670, f"Payée : {invoice.paid_date}")
    c.showPage()
    c.save()

    pdf = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{invoice.reference_number}.pdf"'
    return response