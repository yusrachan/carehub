from django.db import models
from accounts.models import User
from patients.models import Patient
from offices.models import Office

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    practitioner = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'userofficerole__role': 'practitioner'})
    office = models.ForeignKey(Office, on_delete=models.CASCADE)
    app_date = models.DateTimeField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    def __str__(self):
        return f"RDV {self.app_date} - {self.patient} avec {self.practitioner}"