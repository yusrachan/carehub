from django.db import models
from accounts.models import User
from patients.models import Patient
from offices.models import Office
from billing.models import PathologyDetail
from prescriptions.models import Prescription
from prescriptions.utils import get_session_number

class Agenda(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="agenda")
    practitioner = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'userofficerole__role': 'practitioner'})
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="agenda", null=True, blank=True)
    office = models.ForeignKey(Office, on_delete=models.CASCADE)
    app_date = models.DateTimeField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    payment_mode = models.CharField(
        max_length=20,
        choices=[('total', 'Total à payer'), ('tiers_payant', 'Tiers Payant')],
        default='total',
    )

    code_prestation = models.CharField(max_length=20, blank=True, null=True)
    code_dossier = models.CharField(max_length=20, blank=True, null=True)
    honoraires_total = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    remboursement = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    tiers_payant = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)


    def __str__(self):
        return f"RDV {self.app_date} - {self.patient} avec {self.practitioner}"
    
    def calculate_pricing(self, is_bim: bool):
        nb_sessions_done = Agenda.objects.filter(
            patient=self.patient,
            prescription=self.prescription
        ).count()

        session_label = get_session_number(self.prescription.pathology_category.code, nb_sessions_done)
        is_first_session = (session_label == '1ère')

        try:
            pathology_detail = PathologyDetail.objects.get(
                category=self.prescription.pathology_category,
                session_label=session_label
            )
        except PathologyDetail.DoesNotExist:
            return None

        honoraires_total = pathology_detail.honoraire_presta or 0
        if is_first_session:
            honoraires_total += pathology_detail.honoraire_dossier or 0
        if pathology_detail.honoraire_depla:
            honoraires_total += pathology_detail.honoraire_depla

        return {
            "code_prestation": pathology_detail.code_presta,
            "code_dossier": pathology_detail.code_dossier if is_first_session else None,
            "honoraires_total": honoraires_total,
            "remboursement": pathology_detail.reimbursement_bim if is_bim else pathology_detail.reimbursement_non_bim,
            "tiers_payant": pathology_detail.tm_bim if is_bim else pathology_detail.tm_not_bim,
        }
    
    def finalize_and_create_invoice(self, practitioner, due_date):
        """
        Marque le rdv comme completed et génère automatiquement la facture associée.
        """
        from invoices.models import Invoice

        self.status = 'completed'
        self.save()

        if not hasattr(self, 'invoice'):
            Invoice.objects.create(
                patient=self.patient,
                practitioner=practitioner,
                agenda=self,
                due_date=due_date
            )