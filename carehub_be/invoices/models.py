import datetime
from django.db import models
from patients.models import Patient
from accounts.models import User
from agenda.models import Agenda
import datetime

class Invoice(models.Model):
    STATE_CHOICES = [
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('overdue', 'Overdue'),
    ]

    agenda = models.ManyToManyField(Agenda, related_name="invoices")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    practitioner = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'userofficerole__role': 'practitioner'})
    sending_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='pending')
    reference_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    pdf_file = models.FileField(upload_to='invoices/', blank=True, null=True)

    def __str__(self):
        return f"Facture {self.reference_number} - {self.patient} - {self.amount}€ - {self.state}"
    
    def calculate_total_amount(self):
        total = sum([appt.honoraires_total or 0 for appt in self.agenda.all()])
        self.amount = total
        return total
    
    def save(self, *args, **kwargs):
        if not self.amount:
            self.calculate_total_amount()
            
        if not self.reference_number:
            current_year = datetime.date.today().year
            last_invoice = Invoice.objects.filter(reference_number__startswith=f"FAC - {current_year}").order_by('id').last()
            last_number = int(last_invoice.reference_number.split('-')[-1]) if last_invoice and last_invoice.reference_number else 0                
            
            self.reference_number = f"FAC - {current_year} - {last_number + 1:04d}"

        super().save(*args, **kwargs)