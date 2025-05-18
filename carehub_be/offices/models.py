from django.db import models
from rest_framework.exceptions import ValidationError

class Office(models.Model):
    name = models.CharField(max_length=255)
    bce_number = models.CharField(max_length=50, unique=True)
    street = models.CharField(max_length=255)
    number_street = models.CharField(max_length=10)
    box = models.CharField(max_length=10, blank=True, null=True)
    zipcode = models.CharField(max_length=10)
    city = models.CharField(max_length=100)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=20)

    def __str__(self):
        return self.name
    
    def validate_office_data(bce_number, email):
        if Office.objects.filter(bce_number=bce_number).exists():
            raise ValidationError("Ce numéro BCE est déjà enregistre.")
        if Office.objects.filter(email=email).exists():
            raise ValidationError("Cet email esy déjà utilisé.")