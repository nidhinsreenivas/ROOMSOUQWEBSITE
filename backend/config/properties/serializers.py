
from rest_framework import serializers
from .models import Property, PropertyImage


class PropertyImageSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    image = serializers.ImageField(read_only=True)

    def get_id(self, obj):
        return str(obj.pk) if obj.pk else None

    class Meta:
        model = PropertyImage
        fields = ["id", "image"]


class PropertySerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    gallery_images = PropertyImageSerializer(many=True, read_only=True)

    def get_id(self, obj):
        return str(obj.pk) if obj.pk else None

    class Meta:
        model = Property
        fields = [
            "id",
            "agent_name",
            "title",
            "description",
            "category",
            "location",
            "monthly_rent",
            "image_url",
            "image",
            "gallery_images",
            "is_approved",
            "is_available",
            "created_at",
        ]
        read_only_fields = ["id", "is_approved", "created_at"]
