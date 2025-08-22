from rest_framework import serializers
from billing.models import PathologyCategory

class PathologyCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PathologyCategory
        fields = ("id", "code", "label")
