"""Simple token auth: one admin user from env, signed tokens with expiry. Rate-limited login."""
import os
import json
import time
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature

# Token valid for 7 days
TOKEN_MAX_AGE_SECONDS = 7 * 24 * 3600
SIGNER = TimestampSigner()

# Simple in-memory rate limit: max 5 login attempts per IP per 60 seconds
_LOGIN_ATTEMPTS = {}  # ip -> [timestamps]
RATE_LIMIT_COUNT = 5
RATE_LIMIT_WINDOW = 60


def _rate_limit(ip: str) -> bool:
    now = time.monotonic()
    if ip not in _LOGIN_ATTEMPTS:
        _LOGIN_ATTEMPTS[ip] = []
    times = _LOGIN_ATTEMPTS[ip]
    times[:] = [t for t in times if now - t < RATE_LIMIT_WINDOW]
    if len(times) >= RATE_LIMIT_COUNT:
        return False
    times.append(now)
    return True


def get_admin_credentials():
    """Admin email and password from env (defaults for initial setup)."""
    return (
        (os.environ.get('ADMIN_EMAIL') or 'smartland0990@admin.login.com').strip(),
        (os.environ.get('ADMIN_PASSWORD') or 'smartlandbyme@21').strip(),
    )


def create_token(email: str) -> str:
    return SIGNER.sign(email)


def verify_token(token: str) -> str | None:
    """Return email if token is valid and not expired, else None."""
    if not token:
        return None
    try:
        return SIGNER.unsign(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except (SignatureExpired, BadSignature):
        return None


def get_token_from_request(request):
    """Extract Bearer token from Authorization header."""
    auth = request.META.get('HTTP_AUTHORIZATION') or ''
    if auth.startswith('Bearer '):
        return auth[7:].strip()
    return None


def _error_json(message: str, status: int, detail: str | None = None):
    """Return consistent JSON error for API consumers."""
    payload = {'error': message}
    if detail:
        payload['detail'] = detail
    return JsonResponse(payload, status=status)


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """POST { "email": "...", "password": "..." } -> { "token": "...", "email": "..." } or 4xx with JSON error."""
    ip = request.META.get('REMOTE_ADDR') or 'unknown'
    if not _rate_limit(ip):
        return _error_json('Too many login attempts. Try again later.', 429)
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return _error_json('Invalid JSON body', 400, 'Request body must be valid JSON')
    email = (body.get('email') or '').strip()
    password = body.get('password') or ''
    if not email or not password:
        return _error_json('Email and password required', 400)
    admin_email, admin_password = get_admin_credentials()
    if not admin_email or not admin_password:
        return _error_json('Auth not configured', 503)
    if email != admin_email or password != admin_password:
        return _error_json('Invalid email or password', 401)
    token = create_token(email)
    return JsonResponse({'token': token, 'email': email})
