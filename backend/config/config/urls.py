from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path
from django.middleware.csrf import get_token

from django.http import JsonResponse
from django.middleware.csrf import get_token


def csrf_token_view(request):
    return JsonResponse({"csrfToken": get_token(request)})

def health_check(request):
    return JsonResponse({
        "service": "Room Souq API",
        "status": "running",
    })


urlpatterns = [
    path("api/health/", health_check, name="health-check"),
    path("api/properties/", include("properties.urls")),
    path("api/csrf/", csrf_token_view, name="csrf-token"),
    path("api/furniture/", include("furniture.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)