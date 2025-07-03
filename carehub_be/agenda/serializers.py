from rest_framework import serializers
from .models import Agenda

class AgendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agenda
        fields = '__all__'
    
    def create(self, validated_data):
        agenda = Agenda.objects.create(**validated_data)
        is_bim = self.context['request'].data.get('is_bim', False)

        pricing = agenda.calculate_pricing(is_bim=is_bim)
        if pricing is None:
            raise serializers.ValidationError("Impossible de calculer la tarification. Vérifiez les données.")

        agenda.code_prestation = pricing["code_prestation"]
        agenda.code_dossier = pricing["code_dossier"]
        agenda.honoraires_total = pricing["honoraires_total"]
        agenda.remboursement = pricing["remboursement"]
        agenda.tiers_payant = pricing["tiers_payant"]
        agenda.save()

        return agenda