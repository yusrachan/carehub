from django.db import models
from offices.models import Office
from datetime import date
from django.utils import timezone

class Subscription(models.Model):
    PLAN_CHOICES = [
        ('Small_Cab', 'Petit cabinet'),
        ('Medium_Cab', 'Moyen cabinet'),
        ('Big_Cab', 'Grand cabinet'),
    ]

    STATE_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('pending', 'Pending'),
    ]

    STRIPE_STATUS_CHOICES = [
        ('trialing', 'trialing'),
        ('active', 'active'),
        ('past_due', 'past_due'),
        ('canceled', 'canceled'),
        ('incomplete', 'incomplete'),
        ('incomplete_expired', 'incomplete_expired'),
        ('paused', 'paused'),
        ('unpaid', 'unpaid'),
        (None, 'unknown'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('past_due', 'Past due')
    ]

    office = models.OneToOneField(Office, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='Small_Cab')
    grace_until = models.DateTimeField(null=True, blank=True)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='pending')

    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')

    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_price_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_status = models.CharField(max_length=32, choices=STRIPE_STATUS_CHOICES, blank=True, null=True)
    latest_invoice_id = models.CharField(max_length=255, blank=True, null=True)
    hosted_invoice_url = models.URLField(blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    cancel_at_period_end = models.BooleanField(default=False)
    currency = models.CharField(max_length=8, default='eur', blank=True)

    def __str__(self):
        return f"Abonnement {self.office} - {self.stripe_status or self.state}"
    
    def is_active(self):
        if getattr(self, 'stripe_status', None) in ('trialing', 'active'):
            return True
        if self.grace_until and timezone() <= self.grace_until:
            return True
        if self.stripe_status in ('past_due', 'unpaid', 'paused', 'canceled', 'incomplete', 'incomplete_expired'):
            return False
        
        return bool(getattr(self,'start_date', None) and getattr(self, 'end_date', None) and self.start_date <= date.today() <= self.end_date)
