
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Furniture
from .serializers import FurnitureSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

from .models import Furniture
from .serializers import FurnitureSerializer

class FurnitureListView(generics.ListAPIView):
    serializer_class = FurnitureSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Furniture.objects.filter(is_available=True).order_by("-created_at")


class AdminFurnitureListCreateView(generics.ListCreateAPIView):
    queryset = Furniture.objects.all().order_by("-created_at")
    serializer_class = FurnitureSerializer
    permission_classes = [IsAdminUser]
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class AdminFurnitureDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Furniture.objects.all()
    serializer_class = FurnitureSerializer
    permission_classes = [IsAdminUser]
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    lookup_field = "pk"
    parser_classes = [MultiPartParser, FormParser, JSONParser]
