
from rest_framework import generics
from rest_framework import status

from .models import Property
from .serializers import PropertySerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from .models import WhatsAppSetting
from django.contrib.auth import authenticate

from .models import Property, PropertyImage, WhatsAppSetting
from rest_framework.generics import RetrieveUpdateAPIView


class ApprovedPropertyListView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Property.objects.filter(
            is_approved=True
        ).order_by("-created_at")


# Public: submit a property for approval

class PropertySubmitView(generics.CreateAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        from django.db import transaction
        from .models import PropertyImage

        uploaded_images = request.FILES.getlist("images")

        # Preserve the first image in the legacy image field.
        data = request.data.copy()
        if uploaded_images and not data.get("image"):
            data["image"] = uploaded_images[0]

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            property_obj = serializer.save()

            for uploaded_image in uploaded_images:
                PropertyImage.objects.create(
                    property=property_obj,
                    image=uploaded_image,
                )

        headers = self.get_success_headers(serializer.data)
        return Response(
            self.get_serializer(property_obj).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


# Temporary: list pending properties
class PendingPropertyListView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Property.objects.filter(
            is_approved=False
        ).order_by("-created_at")


# Temporary: approve a property
class ApprovePropertyView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        property_obj = get_object_or_404(Property, pk=pk)
        property_obj.is_approved = True
        property_obj.save()

        return Response(
            {
                "message": "Property approved successfully",
                "property_id": str(property_obj.pk),
                "is_approved": property_obj.is_approved,
            },
            status=status.HTTP_200_OK,
        )


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")

        user = authenticate(
            request=request._request,
            username=username,
            password=password,
        )

        if user is None or not user.is_staff or not user.is_active:
            return Response(
                {"error": "Invalid admin credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        from django.contrib.auth import login
        login(request._request, user)

        return Response({
            "message": "Admin login successful",
            "username": user.username,
        })


from rest_framework import generics
from rest_framework import status

from .models import Property
from .serializers import PropertySerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser

from django.contrib.auth import authenticate


class ApprovedPropertyListView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Property.objects.filter(
            is_approved=True
        ).order_by("-created_at")


# Public: submit a property for approval

class PropertySubmitView(generics.CreateAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        uploaded_images = request.FILES.getlist("images")

        # Preserve compatibility with existing single-image listings.
        data = request.data.copy()

        if uploaded_images and not data.get("image"):
            data["image"] = uploaded_images[0]

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        property_obj = serializer.save()

        # Save each selected photo as a separate gallery record.
        for uploaded_image in uploaded_images:
            PropertyImage.objects.create(
                property=property_obj,
                image=uploaded_image,
            )

        return Response(
            self.get_serializer(property_obj).data,
            status=status.HTTP_201_CREATED,
        )

# Temporary: list pending properties
class PendingPropertyListView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Property.objects.filter(
            is_approved=False
        ).order_by("-created_at")




class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")

        user = authenticate(
            request=request._request,
            username=username,
            password=password,
        )

        if user is None or not user.is_staff or not user.is_active:
            return Response(
                {"error": "Invalid admin credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        from django.contrib.auth import login
        login(request._request, user)

        return Response({
            "message": "Admin login successful",
            "username": user.username,
        })


class PropertyAvailabilityView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        property_obj = get_object_or_404(Property, pk=pk)

        is_available = request.data.get("is_available")

        if not isinstance(is_available, bool):
            return Response(
                {"error": "is_available must be true or false"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        property_obj.is_available = is_available
        property_obj.save(update_fields=["is_available"])

        return Response({
            "message": "Property availability updated successfully",
            "property_id": str(property_obj.pk),
            "is_available": property_obj.is_available,
        })


class AdminPropertyListView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Property.objects.filter(
            is_approved=True
        ).order_by("-created_at")



class WhatsAppNumberView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        setting = WhatsAppSetting.objects.first()

        if setting is None:
            setting = WhatsAppSetting.objects.create(number="")

        return Response({"number": setting.number})


class AdminWhatsAppNumberView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        setting = WhatsAppSetting.objects.first()

        if setting is None:
            setting = WhatsAppSetting.objects.create(number="")

        return Response({"number": setting.number})

    def put(self, request):
        number = str(request.data.get("number", "")).strip()
        number = number.replace("+", "").replace(" ", "").replace("-", "")

        if not number.isdigit() or not 8 <= len(number) <= 15:
            return Response(
                {"error": "Enter a valid WhatsApp number with country code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        setting = WhatsAppSetting.objects.first()

        if setting is None:
            setting = WhatsAppSetting.objects.create(number=number)
        else:
            setting.number = number
            setting.save()

        return Response({
            "message": "WhatsApp number updated successfully.",
            "number": setting.number,
        })

class AdminPropertyDetailView(RetrieveUpdateAPIView):
    serializer_class = PropertySerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Property.objects.all()
