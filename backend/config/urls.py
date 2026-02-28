import logging
from django.urls import path, include
from django.http import JsonResponse

logger = logging.getLogger("api")

def root_view(request):
    """Root URL: confirm this is the Land Management backend."""
    return JsonResponse({
        "ok": True,
        "app": "Smart Land & Farm Management API",
        "docs": "/api/dashboard",
    })

def health_view(request):
    """Health check: backend + MongoDB ping. Never raises; always returns JSON."""
    try:
        from api.db import get_db
        db = get_db()
        db.command("ping")
        mongo = "ok"
    except Exception as e:
        logger.warning("health_view: mongo ping failed: %s", e)
        mongo = str(e)
    return JsonResponse({
        "ok": True,
        "backend": "ok",
        "mongo": mongo,
    })


def ready_view(request):
    """Production readiness: DB connected, required collections exist. Never raises; always returns JSON."""
    try:
        from api.db import get_database_readiness
        r = get_database_readiness()
        ready = r.get("mongo") == "connected" and not r.get("error")
        status = 200 if ready else 503
        return JsonResponse({
            "ready": bool(ready),
            "mongo": r.get("mongo", "unknown"),
            "collections": r.get("collections", {}),
            "indexes_ok": r.get("indexes_ok", False),
            "error": r.get("error"),
        }, status=status)
    except Exception as e:
        logger.exception("ready_view: unexpected error")
        return JsonResponse({
            "ready": False,
            "mongo": "unknown",
            "collections": {},
            "indexes_ok": False,
            "error": str(e),
        }, status=503)


urlpatterns = [
    path('', root_view),
    # API endpoints use no trailing slash so they match Next.js /api/* routes without redirects.
    path('api/health', health_view),
    path('api/ready', ready_view),
    path('api/', include('api.urls')),
]
