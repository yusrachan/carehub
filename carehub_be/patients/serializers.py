from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'name', 'surname', 'birth_date', 'street', 'street_number', 'box', 'zipcode', 'city', 'telephone', 'email', 'medical_history', 'office'], 