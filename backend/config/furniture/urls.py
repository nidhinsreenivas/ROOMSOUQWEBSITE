
from django.urls import path
from .views import (
    FurnitureListView,
    AdminFurnitureListCreateView,
    AdminFurnitureDetailView,
)

urlpatterns = [
    path("", FurnitureListView.as_view(), name="furniture-list"),
    path(
        "manage/",
        AdminFurnitureListCreateView.as_view(),
        name="furniture-manage",
    ),
    path(
        "manage/<str:pk>/",
        AdminFurnitureDetailView.as_view(),
        name="furniture-detail",
    ),
]
