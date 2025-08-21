from django.utils import timezone
from decimal import Decimal
from django.conf import settings
from django.db import models
from accounts.models import User
from patients.models import Patient
from offices.models import Office
from billing.models import PathologyCategory, PathologyDetail
from prescriptions.models import Prescription
from prescriptions.utils import get_session_number

class Agenda(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    COVERAGE_CHOICES = [
        ('prescription', 'Prescription'),
        ('annual', 'Annual Quota'),
    ]

    PLACE_CHOICES = [
        ("home", "Domicile"),
        ("office", "Cabinet"),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="agenda")
    practitioner = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'userofficerole__role': 'practitioner'})
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="agenda", null=True, blank=True)
    office = models.ForeignKey(Office, on_delete=models.CASCADE)
    pathology_category = models.ForeignKey(PathologyCategory, on_delete=models.PROTECT, null=True, blank=True,
        help_text="Catégorie utilisée quand coverage_source = annual."
    )

    app_date = models.DateTimeField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    payment_mode = models.CharField(
        max_length=20,
        choices=[('total', 'Total à payer'), ('tiers_payant', 'Tiers Payant')],
        default='total',
    )
    place = models.CharField(max_length=10, choices=PLACE_CHOICES, default="home")

    code_prestation = models.CharField(max_length=20, blank=True, null=True)
    code_dossier = models.CharField(max_length=20, blank=True, null=True)
    honoraires_total = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    remboursement = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    tiers_payant = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)

    duration_minutes = models.PositiveSmallIntegerField(default=30)
    session_index = models.PositiveSmallIntegerField(null=True, blank=True)
    coverage_source = models.CharField(max_length=20, choices=COVERAGE_CHOICES, default='prescription')
    is_over_annual = models.BooleanField(default=False)

    
    def __str__(self):
        return f"RDV {self.app_date} - {self.patient} avec {self.practitioner}"
    
    def _compute_session_index(self):
        """
        Numéro de séance “consommé” :
        - si couverture prescription : index au sein de la prescription
        - si annuel : index au sein de l'année civile (pour la catégorie choisie)
        On fige l'index en base (session_index) côté prescription ; pour l'annuel,
        on peut le recalculer à la volée si non stocké.
        """
        if self.coverage_source == "prescription" and self.session_index:
            return self.session_index

        year = timezone.localtime(self.app_date).year
        qs = Agenda.objects.filter(
            patient=self.patient,
            coverage_source="annual",
            app_date__year=year
        ).exclude(status="cancelled").order_by("app_date")

        return qs.count() + 1
    
    def calculate_pricing(self, is_bim: bool):
        """
        Pricing minimal :
        - Prescription,
        - Annual <= 18 : logique 'annuelle
        - Annual > 18 : pas de remboursement, pas de tiers payant
        """
        if not self.place:
            self.place = "home"

        year = timezone.localtime(self.app_date).year
        category = getattr(self.prescription, "pathology_category", None) or getattr(self, "pathology_category", None)
        if not category:
            return None

        session_idx = self._compute_session_index()

        tariff = (PathologyDetail.objects
            .filter(year=year, category=category, place=self.place, session_min__lte=session_idx)
            .filter(models.Q(session_max__isnull=True) | models.Q(session_max__gte=session_idx))
            .first())

        if not tariff:
            return None

        is_first = (session_idx == 1)
        honoraires_total = (tariff.hon_presta or 0) + (tariff.hon_depla or 0) + ((tariff.hon_dossier or 0) if is_first else 0)

        remb = tariff.reimb_bim if is_bim else tariff.reimb_not_bim
        tm = tariff.tm_bim   if is_bim else tariff.tm_not_bim

        if self.coverage_source == "annual" and self.is_over_annual:
            remb = 0
            tm = honoraires_total
        return {
            "code_prestation": tariff.code_presta,
            "code_dossier": tariff.code_dossier if is_first else None,
            "honoraires_total": honoraires_total,
            "remboursement": remb,
            "tiers_payant": 0 if (self.coverage_source == "annual" and self.is_over_annual) else tm,
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
    
    class Meta:
        ordering = ['app_date']
        indexes = [
            models.Index(fields=['office', 'practitioner', 'app_date']),
            models.Index(fields=['patient', 'app_date']),
            models.Index(fields=['prescription', 'app_date']),
            models.Index(fields=['status']),
            models.Index(fields=['coverage_source', 'app_date']),
        ]
        unique_together = []