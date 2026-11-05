
from rest_framework import serializers
from .models import Furniture


class FurnitureSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Furniture
        fields = [
            "id",
            "name",
            "category",
            "description",
            "price",
            "location",
            "image",
            "image_url",
            "is_available",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_id(self, obj):
        return str(obj.pk)

    def get_image_url(self, obj):
        request = self.context.get("request")

        if obj.image:
            image_url = obj.image.url
            if request:
                return request.build_absolute_uri(image_url)
            return image_url

        return obj.image_url or ""
