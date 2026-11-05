
from django.urls import path

from .views import (
    ApprovedPropertyListView,
    PropertySubmitView,
    PendingPropertyListView,
    ApprovePropertyView,
    AdminLoginView,
    PropertyAvailabilityView,
    AdminPropertyListView,
    WhatsAppNumberView,
    AdminWhatsAppNumberView,
    AdminPropertyDetailView,
)

urlpatterns = [
    path("", ApprovedPropertyListView.as_view(), name="property-list"),
    path("submit/", PropertySubmitView.as_view(), name="property-submit"),
    path("pending/", PendingPropertyListView.as_view(), name="property-pending"),
    path("approve/<str:pk>/", ApprovePropertyView.as_view(), name="property-approve"),
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path(
        "manage/<str:pk>/availability/",
        PropertyAvailabilityView.as_view(),
        name="property-availability",
    ),
    path(
        "manage/",
        AdminPropertyListView.as_view(),
        name="admin-property-list",
    ),
    path("whatsapp/", WhatsAppNumberView.as_view(), name="whatsapp-number"),
    path(
        "admin/whatsapp/",
        AdminWhatsAppNumberView.as_view(),
        name="admin-whatsapp-number",
    ),
    path(
    "manage/<str:pk>/",
    AdminPropertyDetailView.as_view(),
    name="admin-property-detail",
    ),
]
