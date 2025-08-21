from rest_framework import serializers
from .models import User, UserOfficeRole

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'name', 'surname', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', ''),
            surname=validated_data.get('surname', ''),
        )
        return user

class UserOfficeRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserOfficeRole
        fields = ['office_id', 'role']

class UserSerializer(serializers.ModelSerializer):
    roles = UserOfficeRoleSerializer(source='userofficerole_set', many=True, read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'roles', 'surname']


class PractitionerLiteSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "name")

    def get_name(self, obj):
        full = getattr(obj, "get_full_name", None)
        if callable(full):
            n = obj.get_full_name()
            if n:
                return n
        parts = [getattr(obj, "name", ""), getattr(obj, "surname", "")]
        nm = " ".join([p for p in parts if p]).strip()
        return nm or getattr(obj, "username", f"user-{obj.pk}")