
from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class Furniture(models.Model):
    id = ObjectIdAutoField(primary_key=True)

    CATEGORY_CHOICES = [
        ("bed", "Beds"),
        ("sofa", "Sofas"),
        ("table", "Tables"),
        ("chair", "Chairs"),
        ("wardrobe", "Wardrobes"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES
    )
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=200)
    image_url = models.URLField(max_length=500, blank=True)
    image = models.ImageField(
    upload_to="furniture/",
    blank=True,
    null=True
)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

