from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import Agenda

ANNUAL_QUOTA = 18

def _count_prescription_planned(prescription):
    return Agenda.objects.filter(prescription=prescription).exclude(status='cancelled').count()

def _count_annual_planned(patient, year):
    return (Agenda.objects
            .filter(patient=patient, coverage_source='annual', app_date__year=year)
            .exclude(status='cancelled')
            .count())

class AgendaSerializer(serializers.ModelSerializer):
    duration_minutes = serializers.IntegerField(required=False)

    class Meta:
        model = Agenda
        fields = '__all__'
        extra_kwargs = { 'office': {'read_only': True}, }

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)

        app_date = attrs.get('app_date') or (instance.app_date if instance else None)
        practitioner = attrs.get('practitioner') or (instance.practitioner if instance else None)
        office = attrs.get('office') or (instance.office if instance else None)
        patient = attrs.get('patient') or (instance.patient if instance else None)
        pres = attrs.get('prescription') or (instance.prescription if instance else None)

        if not all([app_date, practitioner, office, patient]):
            return attrs

        place = attrs.get('place') or (instance.place if instance else 'home')
        attrs['place'] = place or 'home'

        if pres and hasattr(pres, 'sessions_max') and pres.sessions_max is not None:
            planned = _count_prescription_planned(pres)
            if planned >= pres.sessions_max:
                attrs['prescription'] = None

        will_be_prescription = attrs.get('prescription') is not None
        if not will_be_prescription:
            pathology_category = attrs.get('pathology_category') or (instance.pathology_category if instance else None)
            if pathology_category is None:
                raise serializers.ValidationError(
                    "En mode 'annual', 'pathology_category' est requis pour tarifer."
                )
            attrs['coverage_source'] = 'annual'
        else:
            attrs['coverage_source'] = 'prescription'

        duration = attrs.get('duration_minutes') or (instance.duration_minutes if instance else 30)
        start_dt = app_date
        end_dt = app_date + timedelta(minutes=duration)
        qs = Agenda.objects.filter(practitioner=practitioner, office=office).exclude(status='cancelled')
        if instance:
            qs = qs.exclude(pk=instance.pk)

        overlap = qs.filter(app_date__lt=end_dt, app_date__gte=start_dt - timedelta(hours=12)).exists()
        if overlap:
            raise serializers.ValidationError("Chevauchement de rendez-vous pour ce praticien.")

        return attrs

    def _compute_session_index(self, pres):
        return _count_prescription_planned(pres) + 1 if pres else None

    def _compute_is_over_annual(self, patient, app_date, coverage_source):
        year = timezone.localtime(app_date).year
        count = _count_annual_planned(patient, year)
        if coverage_source == 'annual':
            count += 1
        return count > ANNUAL_QUOTA

    def _apply_pricing(self, agenda, request):
        is_bim = bool(request and request.data.get('is_bim', False))
        pricing = agenda.calculate_pricing(is_bim=is_bim)
        if not pricing:
            raise serializers.ValidationError("Tarification indisponible (données INAMI manquantes ?).")
        agenda.code_prestation = pricing.get("code_prestation")
        agenda.code_dossier = pricing.get("code_dossier")
        agenda.honoraires_total = pricing.get("honoraires_total")
        agenda.remboursement = pricing.get("remboursement")
        agenda.tiers_payant = pricing.get("tiers_payant")
        agenda.save(update_fields=[
            "code_prestation","code_dossier","honoraires_total","remboursement","tiers_payant"
        ])

    def create(self, validated_data):
        request = self.context.get('request')
        print("[DEBUG create] vd keys:", list(validated_data.keys()))
        print("[DEBUG create] patient:", validated_data.get('patient'),
            "prescription:", validated_data.get('prescription'),
            "pathology_category:", validated_data.get('pathology_category'),
            "place:", validated_data.get('place'))
        pres = validated_data.get('prescription')

        if pres:
            validated_data['coverage_source'] = 'prescription'
            validated_data['session_index'] = self._compute_session_index(pres)
        else:
            validated_data['coverage_source'] = 'annual'
            validated_data['session_index'] = None

        patient = validated_data['patient']
        app_date = validated_data['app_date']
        validated_data['is_over_annual'] = self._compute_is_over_annual(patient, app_date, validated_data['coverage_source'])

        validated_data['place'] = validated_data.get('place') or 'home'

        agenda = Agenda.objects.create(**validated_data)
        self._apply_pricing(agenda, request)
        return agenda

    def update(self, instance, validated_data):
        request = self.context.get('request')

        pres_new = validated_data.get('prescription', instance.prescription)
        if pres_new and hasattr(pres_new, 'sessions_max') and pres_new.sessions_max is not None:
            planned = _count_prescription_planned(pres_new)
            if planned >= pres_new.sessions_max:
                pres_new = None
                validated_data['prescription'] = None

        if pres_new:
            validated_data['coverage_source'] = 'prescription'
            validated_data['session_index'] = self._compute_session_index(pres_new)
        else:
            validated_data['coverage_source'] = 'annual'
            validated_data['session_index'] = None
            pathology_category = validated_data.get('pathology_category') or instance.pathology_category
            if pathology_category is None:
                raise serializers.ValidationError(
                    "En mode 'annual', 'pathology_category' est requis pour tarifer."
                )

        patient = validated_data.get('patient', instance.patient)
        app_date = validated_data.get('app_date', instance.app_date)
        validated_data['is_over_annual'] = self._compute_is_over_annual(patient, app_date, validated_data['coverage_source'])

        if not validated_data.get('place'):
            validated_data['place'] = getattr(instance, 'place', 'home') or 'home'

        agenda = super().update(instance, validated_data)
        self._apply_pricing(agenda, request)
        return agenda
