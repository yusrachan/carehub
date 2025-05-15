from rest_framework import serializers
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'
    
    def create(self, validated_data):
        appointment = Appointment.objects.create(**validated_data)
        is_bim = self.context['request'].data.get('is_bim', False)

        pricing = appointment.calculate_pricing(is_bim=is_bim)
        if pricing is None:
            raise serializers.ValidationError("Impossible de calculer la tarification. Vérifiez les données.")

        appointment.code_prestation = pricing["code_prestation"]
        appointment.code_dossier = pricing["code_dossier"]
        appointment.honoraires_total = pricing["honoraires_total"]
        appointment.remboursement = pricing["remboursement"]
        appointment.tiers_payant = pricing["tiers_payant"]
        appointment.save()

        return appointment