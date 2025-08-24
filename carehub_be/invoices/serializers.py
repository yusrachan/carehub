from rest_framework import serializers
from .models import Invoice
from agenda.models import Agenda

class AgendaMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agenda
        fields = [
            "id",
            "app_date",
            "duration_minutes",
            "honoraires_total",
            "code_prestation",
            "coverage_source",
            "status",
            "patient",
            "practitioner",
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    agenda = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Agenda.objects.all()
    )
    agenda_details = AgendaMiniSerializer(source="agenda", many=True, read_only=True)

    patient_display = serializers.SerializerMethodField()
    practitioner_display = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "reference_number",
            "state",
            "amount",
            "sending_date",
            "due_date",
            "paid_date",
            "description",
            "pdf_file",
            "patient",
            "patient_display",
            "practitioner",
            "practitioner_display",
            "agenda",
            "agenda_details",
        ]
        read_only_fields = ["reference_number", "sending_date", "amount", "pdf_file"]

    def get_patient_display(self, obj):
        return str(obj.patient) if obj.patient else None

    def get_practitioner_display(self, obj):
        return str(obj.practitioner) if obj.practitioner else None
