from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            "id", "office",
            "name", "surname", "birth_date",
            "street", "street_number", "box", "zipcode", "city",
            "telephone", "email",
            "medical_history",
            "is_tiers_payant",
            "last_contact_date",
            "is_deleted",
            "full_name", "created_at",
        ]
        read_only_fields = ["id", "office", "created_at"]