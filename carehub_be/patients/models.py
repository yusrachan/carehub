from django.db import models

class Patient(models.Model):
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=50)
    birth_date = models.DateField()
    address = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20)
    email = models.EmailField(max_length=100)
    medical_history = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} {self.surname}"