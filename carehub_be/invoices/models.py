import datetime
from django.db import models
from patients.models import Patient
from accounts.models import User

class Invoice(models.Model):
    STATE_CHOICES = [
        ('paide', 'Paid'),
        ('pending', 'Pending'),
        ('overdue', 'Overdue'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    practitioner = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'userofficerole__role': 'practitioner'})
    sending_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='pending')
    reference_number = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    pdf_file = models.FileField(upload_to='invoices/', blank=True, null=True)

    def __str__(self):
        return f"Facture {self.reference_number} - {self.patient} - {self.amount}€ - {self.state}"
    
    def save(self, *args, **kwargs):
        if not self.reference_number:
            current_year = datetime.date.today().year
            last_invoice = Invoice.objects.filter(reference_number__startswith=f"FAC-{current_year}").order_by('id').last()

            if last_invoice and last_invoice.reference_number:
                last_number = int(last_invoice.reference_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.reference_number = "FAC-{}-{:04d}".format(current_year, new_number)

        super().save(*args, **kwargs)