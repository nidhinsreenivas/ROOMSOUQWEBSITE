
from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class Property(models.Model):
    id = ObjectIdAutoField(primary_key=True)

    CATEGORY_CHOICES = [
        ("studio", "Studio"),
        ("1_bhk", "1 BHK"),
        ("2_bhk", "2 BHK"),
        ("sharing_room", "Sharing Room"),
        ("master_bedroom", "Master Bedroom"),
        ("bedspace_gents", "Bedspace - Gents"),
        ("bedspace_ladies", "Bedspace - Ladies"),
        ("partition_single", "Partition - Single"),
        ("partition_couple", "Partition - Couple"),
    ]

    agent_name = models.CharField(max_length=100, default="")
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    location = models.CharField(max_length=200)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(max_length=500, blank=True)
    image = models.ImageField(upload_to="properties/", blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class WhatsAppSetting(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    number = models.CharField(max_length=20, default="")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Room Souq WhatsApp Settings"


    def __str__(self):
        return self.title

class PropertyImage(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="gallery_images",
    )
    image = models.ImageField(upload_to="properties/gallery/")

    def __str__(self):
        return f"Image for {self.property.title}"
