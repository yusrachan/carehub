from django.db import models
from accounts.models import User
from patients.models import Patient
from billing.models import PathologyCategory, PathologyDetail

class Prescription(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="prescriptions")
    prescribed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    pathology_category = models.ForeignKey(PathologyCategory, on_delete=models.CASCADE)
    pathology_detail = models.ForeignKey(PathologyDetail, on_delete=models.CASCADE)
    date_prescription = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Prescription pour {self.patient} - {self.pathology_category.code}"