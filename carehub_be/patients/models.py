from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone
from offices.models import Office

class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Homme'),
        ('F', 'Femme'),
        ('O', 'Autre'),
    ]
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=50)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    birth_date = models.DateField()
    street = models.CharField(max_length=255)
    street_number = models.CharField(max_length=10)
    box = models.CharField(max_length=10, blank=True, null=True)
    zipcode = models.CharField(max_length=10)
    city = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20)
    email = models.EmailField(max_length=100)
    medical_history = models.TextField(blank=True)
    office = models.ForeignKey(Office, on_delete=models.CASCADE, blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    last_contact_date = models.DateField(default=timezone.now)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def full_name(self):
        return f"{self.name} {self.surname}".strip()


    def __str__(self):
        return self.full_name
    
    def anonymize(self):
        self.name = 'Anonymized'
        self.surname = f'Patient_{self.id}'
        self.email = None
        self.telephone = None
        self.street = None
        self.street_number = None
        self.box = None
        self.zipcode = None
        self.city = None
        self.medical_history = None
        self.save()
    
    def can_be_removed(self):
        years = getattr(settings, 'DATA_RETENTION_YEARS', 30)
        return self.last_contact_date <= timezone.now().date() - timedelta(days=365 * years)
        
class PatientOffice(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    office = models.ForeignKey(Office, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('patient', 'office')

    def __str__(self):
        return f"{self.patient} - {self.office}"

class PatientAccess(models.Model):
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE)
    practitioner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'userofficerole__role': 'practitioner'})
    granted_by_patient = models.BooleanField(default=False)
    valid_until = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('patient', 'practitioner')
    
    def __str__(self):
        return f"{self.patient} -> {self.practitioner} (Autorisé: {self.granted_by_patient})"