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
    