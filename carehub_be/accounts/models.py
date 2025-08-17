from datetime import timezone
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('L’e-mail est obligatoire')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        if not password:
            raise ValueError('Le mot de passe est obligatoire pour le superuser.')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, max_length=100)
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=50)
    inami = models.CharField(max_length=11, unique=True, null=True, blank=True)
    niss = models.CharField(max_length=11, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'surname']

    def __str__(self):
        return f"{self.name} {self.surname}"

class UserOfficeRole(models.Model):
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('practitioner', 'Practitioner'),
        ('secretary', 'Secretary'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    office = models.ForeignKey('offices.Office', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    class Meta:
        unique_together = ('user', 'office')

class Invitation(models.Model):
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('practitioner', 'Practitioner'),
        ('secretary', 'Secretary'),
    ]
    email = models.EmailField()
    office = models.ForeignKey('offices.Office', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    token = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    name = models.CharField(max_length=50, blank=True)
    surname = models.CharField(max_length=50, blank=True)

    def is_valid(self):
        return (not self.used) and (self.expires_at > timezone.now())
    
    def __str__(self):
        return f"Invitation {self.email} for {self.office}"