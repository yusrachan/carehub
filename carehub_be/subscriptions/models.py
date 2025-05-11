from django.db import models
from offices.models import Office

class Subscription(models.Model):
    STATE_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('pending', 'Pending'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
    ]

    office = models.ForeignKey(Office, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')

    def __str__(self):
        return f"Abonnement {self.id} - {self.office} - {self.state}"
    
    def is_active(self):
        from datetime import date
        today = date.today()
        return self.start_date <= today <= self.end_date
    
    def save(self, *args, **kwargs):
        from datetime import date
        today = date.today()
        if self.start_date > today:
            self.state = 'pending'
        elif self.end_date < today:
            self.state = 'expired'
        else:
            self.state = 'active'
        super().save(*args, **kwargs)