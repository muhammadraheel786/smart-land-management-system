"""Require valid auth token for all /api/ requests except login and health checks."""
from .auth import get_token_from_request, verify_token


def auth_required_middleware(get_response):
    """Return 401 if request is to protected API and missing/invalid token."""
    def middleware(request):
        path = request.path
        # Public API paths (no auth); allow with or without trailing slash
        if path.startswith('/api/auth/login') or path.startswith('/api/health') or path.startswith('/api/ready'):
            return get_response(request)

        if not path.startswith('/api/'):
            return get_response(request)

        token = get_token_from_request(request)
        email = verify_token(token) if token else None
        if not email:
            from django.http import JsonResponse
            return JsonResponse({'error': 'Unauthorized', 'detail': 'Invalid or missing token'}, status=401)
        request.auth_user = email
        return get_response(request)
    return middleware
