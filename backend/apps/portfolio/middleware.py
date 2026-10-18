from django.db import connection
from django.http import HttpRequest, JsonResponse

HEALTH_PATH = "/api/health/"


class HealthCheckMiddleware:
    """Answers the container health check before ALLOWED_HOSTS validation kicks in.

    Docker probes the app as `localhost`, while production only allows the real domain.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        if request.path == HEALTH_PATH:
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
            except Exception:
                return JsonResponse({"status": "error", "database": "unavailable"}, status=503)
            return JsonResponse({"status": "ok"})
        return self.get_response(request)
