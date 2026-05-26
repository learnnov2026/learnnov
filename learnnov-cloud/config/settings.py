"""
LearnNov Cloud — Standalone Django settings for free cloud deployment (Render).
"""
import os
from pathlib import Path
from decouple import config, Csv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY = config('SECRET_KEY', default='learnnov-dev-insecure-change-me-in-production')
DEBUG = config('DEBUG', default='False', cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# ── Application definition ───────────────────────────────────────────────────
INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    # Third-party
    'rest_framework',
    'corsheaders',
    # LearnNov Apps
    'apps.core',
    'apps.academic_programs',
    'apps.university_ads',
    'apps.learnnov_payments',
    'apps.learnnov_certificates',
    'apps.program_ads',
    'apps.learnnov_exams',
    'apps.ai_assistant',
    'apps.course_discussions',
    'django_prometheus',
    'storages',
    'django_cryptography',
    'auditlog',
    'mfa',
]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    'django_prometheus.middleware.PrometheusAfterMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',
    'auditlog.middleware.AuditlogMiddleware',
    'mfa.middleware.MfaMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── Database ──────────────────────────────────────────────────────────────────
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# ── Caching ───────────────────────────────────────────────────────────────────
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
    }
}


# ── Auth ──────────────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

# ── i18n ──────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = 'ar'
TIME_ZONE = 'Asia/Riyadh'
USE_I18N = True
USE_TZ = True
LANGUAGES = [
    ('ar', 'العربية'),
    ('en', 'English'),
]

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# إعداد التخزين السحابي للوسائط إذا توفر اسم الحزمة
GS_BUCKET_NAME = config('GS_BUCKET_NAME', default='')
if GS_BUCKET_NAME:
    DEFAULT_FILE_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'
    GS_DEFAULT_ACL = 'publicRead'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL', default=str(DEBUG), cast=bool)
CORS_ALLOW_CREDENTIALS = True

# ── LearnNov Config ───────────────────────────────────────────────────────────
LEARNNOV_SITE_URL = config('LEARNNOV_SITE_URL', default='https://learnnov.org')
PLATFORM_NAME = 'LearnNov'

# Stripe
LEARNNOV_STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
LEARNNOV_STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
LEARNNOV_STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# HyperPay
LEARNNOV_HYPERPAY_ACCESS_TOKEN = config('HYPERPAY_ACCESS_TOKEN', default='')
LEARNNOV_HYPERPAY_ENTITY_ID_VISA = config('HYPERPAY_ENTITY_VISA', default='')
LEARNNOV_HYPERPAY_ENTITY_ID_MADA = config('HYPERPAY_ENTITY_MADA', default='')
LEARNNOV_HYPERPAY_BASE_URL = config('HYPERPAY_BASE_URL', default='https://eu-prod.oppwa.com')

# ── Security Hardening ────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ── CSRF Trusted Origins (مطلوب لـ GKE Load Balancer) ────────────────────────
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='https://learnnov.org,https://studio.learnnov.org',
    cast=Csv(),
)

# ── Logging (structured for Google Cloud Logging) ─────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': config('LOG_LEVEL', default='INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': config('DJANGO_LOG_LEVEL', default='WARNING'),
            'propagate': False,
        },
    },
}

# ── CSP Settings (Content Security Policy) ────────────────────────────────────
CSP_DEFAULT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
CSP_SCRIPT_SRC = ("'self'", "'unsafe-eval'")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_IMG_SRC = ("'self'", "data:", "https://storage.googleapis.com")
CSP_FRAME_SRC = ("'self'", "https://www.youtube.com", "https://player.vimeo.com")

# ── MFA Settings ──────────────────────────────────────────────────────────────
MFA_UNALLOWED_METHODS = ()
MFA_LOGIN_CALLBACK = ""
MFA_RECHECK = True
MFA_REDIRECT_AFTER_REGISTRATION = "admin:index"
MFA_SUCCESS_REGISTRATION_MSG = "MFA is successfully enabled."
MFA_FIDO2_RP_NAME = "LearnNov"
MFA_ENFORCE_RECOVERY_METHOD = False

def mfa_is_required(request):
    """MFA is mandatory for staff/admins, optional for users"""
    if request.user.is_staff or request.user.is_superuser:
        return True
    return False

MFA_ENFORCE_MFA = mfa_is_required

# ── Jazzmin Admin Dashboard Settings ──────────────────────────────────────────
JAZZMIN_SETTINGS = {
    # title of the window (Will default to current_admin_site.site_title if absent or None)
    "site_title": "LearnNov Admin",

    # Title on the login screen (19 chars max) (defaults to current_admin_site.site_header if absent or None)
    "site_header": "LearnNov",

    # Title on the brand (19 chars max) (defaults to current_admin_site.site_header if absent or None)
    "site_brand": "LearnNov",

    # Welcome text on the login screen
    "welcome_sign": "مرحباً بك في لوحة تحكم LearnNov 🚀",

    # Copyright on the footer
    "copyright": "LearnNov Platform",

    # Custom icons for apps/models
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "academic_programs.AcademicProgram": "fas fa-graduation-cap",
        "academic_programs.ProgramProvider": "fas fa-university",
        "academic_programs.ProgramApplication": "fas fa-file-signature",
        "learnnov_payments.Order": "fas fa-shopping-cart",
        "learnnov_payments.StripePayment": "fab fa-stripe",
        "learnnov_payments.DiscountCode": "fas fa-tags",
        "learnnov_exams.Exam": "fas fa-clipboard-list",
        "university_ads.UniversityAd": "fas fa-bullhorn",
    },
    
    # Enable search in the UI
    "search_model": ["auth.User", "academic_programs.AcademicProgram"],

    # Custom links
    "custom_links": {
        "academic_programs": [{
            "name": "مستشار الأمان الذكي", 
            "url": "security-advisor-ui", 
            "icon": "fas fa-shield-alt",
            "permissions": ["auth.view_user"]
        }]
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-dark",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": False,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "darkly",
    "dark_mode_theme": "darkly",
    "button_classes": {
        "primary": "btn-outline-primary",
        "secondary": "btn-outline-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}

