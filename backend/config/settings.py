import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

# Production: set ALLOWED_HOSTS (comma-separated) e.g. .railway.app,.vercel.app,yourdomain.com
_allowed = os.environ.get('ALLOWED_HOSTS', '').strip()
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(',') if h.strip()] if _allowed else ['*']
# Render: allow RENDER_EXTERNAL_HOSTNAME so you don't have to set ALLOWED_HOSTS manually
_render_host = os.environ.get('RENDER_EXTERNAL_HOSTNAME', '').strip()
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS = list(ALLOWED_HOSTS)
    ALLOWED_HOSTS.append(_render_host)

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.auth_required_middleware',
]

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
            ],
        },
    },
]

DATABASES = {}  # Using MongoDB, not Django DB

# MongoDB Atlas Configuration (REQUIRED for production)
# IMPORTANT: Never use local MongoDB in production. Always use MongoDB Atlas.
# Set MONGO_URI in your .env file with your Atlas connection string.
MONGO_URI = os.environ.get('MONGO_URI', '')
if not MONGO_URI:
    raise ValueError(
        "MONGO_URI environment variable is required. "
        "Please set it in backend/.env with your MongoDB Atlas connection string. "
        "See MONGODB_ATLAS_SETUP.md for instructions."
    )

MONGO_DB = os.environ.get('MONGO_DB', 'land_management')
MONGO_CONNECT_TIMEOUT_MS = int(os.environ.get('MONGO_CONNECT_TIMEOUT_MS', '30000'))
MONGO_SERVER_SELECTION_TIMEOUT_MS = int(os.environ.get('MONGO_SERVER_SELECTION_TIMEOUT_MS', '30000'))

# CORS - allow only production frontend origins. Never use CORS_ALLOW_ALL_ORIGINS.
PRODUCTION_CORS_ORIGINS = [
    'https://www.mashorifarm.com',
    'https://mashorifarm.com',
]
LOCALHOST_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
]
_cors = os.environ.get('CORS_ORIGINS', '').strip()
if _cors:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = list(PRODUCTION_CORS_ORIGINS)
    if DEBUG:
        CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS + LOCALHOST_ORIGINS

# Credentials (cookies/auth) require explicit origins; no wildcard.
CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins (must match frontend origins for cookie/CSRF)
PRODUCTION_CSRF_ORIGINS = [
    'https://www.mashorifarm.com',
    'https://mashorifarm.com',
]
_csrf = os.environ.get('CSRF_TRUSTED_ORIGINS', '').strip()
if _csrf:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf.split(',') if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = list(PRODUCTION_CSRF_ORIGINS)
    if DEBUG:
        CSRF_TRUSTED_ORIGINS = CSRF_TRUSTED_ORIGINS + LOCALHOST_ORIGINS

# Cookie settings (safe defaults; tighten Secure=True in production over HTTPS)
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# APIs must NEVER redirect; return JSON only (401/404, not login redirects).
APPEND_SLASH = False
SECURE_SSL_REDIRECT = False
LOGIN_URL = None  # No HTML login page; API returns 401 JSON
LOGOUT_REDIRECT_URL = None

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Security headers (production-friendly)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Logging for debugging and production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{asctime} {levelname} {name} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'api': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'handlers': ['console'],
            'propagate': False,
        },
    },
}
