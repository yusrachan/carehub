from django.db import models
from offices.models import Office

class Patient(models.Model):
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=50)
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

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} {self.surname}"

class PatientOffice(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    office = models.ForeignKey(Office, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('patient', 'office')

    def __str__(self):
        return f"{self.patient} - {self.office}"