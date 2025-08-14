from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from accounts.models import User, UserOfficeRole

def _role_choices_from_model():
    try:
        field = UserOfficeRole._meta.get_field('role')
        choices = [c[0] for c in getattr(field, 'choices', [])]
        if choices:
            return choices
    except Exception:
        pass
    # fallback si pas de choices définis dans le modèle
    return ['manager', 'secretary', 'practitioner']

ROLE_CHOICES = _role_choices_from_model()

class MeOfficeSerializer(serializers.Serializer):
    id = serializers.CharField(source='office_id')
    name = serializers.SerializerMethodField()
    role = serializers.CharField()
    is_active = serializers.BooleanField()

    def get_name(self, obj):
        office = getattr(obj, 'office', None)
        return getattr(office, 'name', None)
    
class MeSerializer(serializers.ModelSerializer):
    offices = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'surname', 'is_active', 'offices']
        read_only_fields = ['email', 'name', 'surname']

    def get_offices(self, user):
        qs = UserOfficeRole.objects.filter(user=user).select_related('office')
        return [
            {
                'id': str(rel.office_id),
                'name': getattr(rel.office, 'name', None),
                'role': rel.role,
                'is_active': bool(getattr(rel, 'is_active', True)),
            }
            for rel in qs
        ]


class MeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'surname']
        extra_kwargs = {f: {'required': False} for f in ['name', 'surname']}


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class OfficeMemberSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    is_active_in_office = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'surname', 'role', 'is_active_in_office']

    def get_role(self, obj):
        office_id = self.context.get('office_id')
        rel = UserOfficeRole.objects.filter(user=obj, office_id=office_id).first()
        return getattr(rel, 'role', None)

    def get_is_active_in_office(self, obj):
        office_id = self.context.get('office_id')
        rel = UserOfficeRole.objects.filter(user=obj, office_id=office_id).first()
        return getattr(rel, 'is_active', False)


class UpdateMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ROLE_CHOICES)