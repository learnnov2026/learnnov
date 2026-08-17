"""
LearnNov Cloud — Standalone Django settings for free cloud deployment (Render).
"""
import os
from pathlib import Path
from decouple import config, Csv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ──────────────────────────────────────────────────────────────────
# SECRET_KEY يجب أن يُضبط دائماً عبر متغير البيئة.
# إذا لم يوجد، سيرفع decouple استثناءً فورياً عند بدء التطبيق.
# لا توجد قيمة افتراضية — هذا مقصود لحماية بيئة الإنتاج.
SECRET_KEY = config('SECRET_KEY')
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
    'rest_framework_simplejwt',
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
    'default': dj_database_url.parse(
        config('DATABASE_URL', default=f'sqlite:///{BASE_DIR / "db.sqlite3"}'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# ── Caching ───────────────────────────────────────────────────────────────────
REDIS_URL = config('REDIS_URL', default='')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'learnnov_cache',
        }
    }

# ── Celery Settings ───────────────────────────────────────────────────────────
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Riyadh'

# ── MongoDB (NoSQL Document Store for Chat/Logs) ──────────────────────────────
import sys
if 'test' in sys.argv:
    MONGODB_URI = ''
else:
    MONGODB_URI = config('MONGODB_URI', default='mongodb://localhost:27017/learnnov')
MONGODB_DB_NAME = config('MONGODB_DB_NAME', default='learnnov')


# ── Auth ──────────────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        'OPTIONS': {'user_attributes': ('username', 'email', 'first_name', 'last_name')},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ── i18n ──────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = 'ar'
TIME_ZONE = 'Asia/Riyadh'
USE_I18N = True
USE_TZ = True
LOCALE_PATHS = [BASE_DIR / 'locale']
LANGUAGES = [
    ('ar', 'العربية'),
    ('en', 'English'),
]

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

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
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'ai_chat': '20/hour',
    }
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# ── CORS ──────────────────────────────────────────────────────────────────────
TESTING = 'test' in sys.argv or 'pytest' in sys.argv[0]

if not DEBUG and not TESTING:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        "https://learnnov.org",
        "https://studio.learnnov.org",
        "https://learnnov-web.vercel.app",
    ]
else:
    CORS_ALLOW_ALL_ORIGINS = True
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

# TESTING is defined above (before CORS block, line ~191)

if not DEBUG and not TESTING:
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
    default='https://learnnov.org,https://studio.learnnov.org,https://learnnov-web.vercel.app,https://*.vercel.app,https://*.onrender.com',
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
# ملاحظة: 'unsafe-eval' تم إزالتها لتقوية الحماية من XSS.
# إذا احتاجت وحدة JavaScript لـ eval()، يجب استخدام nonce-based CSP بدلاً من ذلك.
CSP_DEFAULT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
CSP_SCRIPT_SRC = ("'self'",)
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
    "show_sidebar": False,
    "show_ui_builder": True,
    # title of the window (Will default to current_admin_site.site_title if absent or None)
    "site_title": "لوحة تحكم LearnNov",

    # Title on the login screen (19 chars max) (defaults to current_admin_site.site_header if absent or None)
    "site_header": "LearnNov",

    # Title on the brand (19 chars max) (defaults to current_admin_site.site_header if absent or None)
    "site_brand": "LearnNov",

    # Logo to use for your site, must be present in static files, used for brand on top left
    "site_logo": "logo.png",

    # Logo to use for login page
    "login_logo": "logo.png",

    # Icon for your site (favicon)
    "site_icon": "logo.png",

    # Welcome text on the login screen
    "welcome_sign": "مرحباً بك في لوحة تحكم LearnNov 🚀",

    # Copyright on the footer
    "copyright": "منصة LearnNov التعليمية",

    
    # Order of apps and models in the sidebar & dashboard
    "order_with_respect_to": [
        # 1. البرامج الأكاديمية والمقررات
        "academic_programs",
        "academic_programs.AcademicProgram",
        "academic_programs.ProgramProvider",
        "academic_programs.FieldOfStudy",
        "academic_programs.Specialization",
        "academic_programs.SpecializationCourse",
        "academic_programs.ProgramModule",
        "academic_programs.ProgramLesson",
        "academic_programs.ProgramApplication",
        "academic_programs.UserReferral",
        "academic_programs.ApplicationStatusHistory",
        # 2. الاختبارات والتقييمات
        "learnnov_exams",
        "learnnov_exams.MockExam",
        "learnnov_exams.Question",
        "learnnov_exams.Choice",
        "learnnov_exams.ExamAttempt",
        "learnnov_exams.StudentAnswer",
        # 3. الشهادات المعتمدة
        "learnnov_certificates",
        "learnnov_certificates.GeneratedCertificate",
        "learnnov_certificates.SpecializationCertificate",
        "learnnov_certificates.CertificateQRCode",
        # 4. المدفوعات والاشتراكات
        "learnnov_payments",
        "learnnov_payments.Order",
        "learnnov_payments.SubscriptionPlan",
        "learnnov_payments.UserSubscription",
        "learnnov_payments.DiscountCode",
        "learnnov_payments.DiscountCodeUsage",
        "learnnov_payments.StripePayment",
        "learnnov_payments.HyperPayPayment",
        # 5. إعلانات الجامعات والشركاء
        "university_ads",
        "university_ads.University",
        "university_ads.UniversityAd",
        "university_ads.AdImpression",
        "university_ads.AdClick",
        # 6. النقاشات والمساعد الذكي
        "course_discussions",
        "course_discussions.DiscussionThread",
        "course_discussions.DiscussionPost",
        "ai_assistant",
        "ai_assistant.ChatMessage",
        # 7. إدارة المستخدمين والأمان
        "auth",
        "auth.User",
        "auth.Group",
        "auditlog",
        "auditlog.LogEntry",
    ],

    # Hide technical or redundant apps from the main sidebar
    "hide_apps": ["sites", "program_ads"],

    # Custom icons for apps/models
    "icons": {
        "auth": "fas fa-user-shield",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "sites.site": "fas fa-globe",
        "auditlog.logentry": "fas fa-history",
        "academic_programs": "fas fa-graduation-cap",
        "academic_programs.AcademicProgram": "fas fa-graduation-cap",
        "academic_programs.ProgramProvider": "fas fa-university",
        "academic_programs.FieldOfStudy": "fas fa-book-open",
        "academic_programs.ProgramModule": "fas fa-layer-group",
        "academic_programs.ProgramLesson": "fas fa-chalkboard-teacher",
        "academic_programs.Specialization": "fas fa-medal",
        "academic_programs.SpecializationCourse": "fas fa-route",
        "academic_programs.ProgramApplication": "fas fa-file-signature",
        "academic_programs.UserReferral": "fas fa-user-plus",
        "academic_programs.ApplicationStatusHistory": "fas fa-stream",
        "university_ads": "fas fa-bullhorn",
        "university_ads.University": "fas fa-university",
        "university_ads.UniversityAd": "fas fa-bullhorn",
        "university_ads.AdImpression": "fas fa-eye",
        "university_ads.AdClick": "fas fa-mouse-pointer",
        "learnnov_payments": "fas fa-credit-card",
        "learnnov_payments.Order": "fas fa-shopping-cart",
        "learnnov_payments.StripePayment": "fab fa-stripe",
        "learnnov_payments.HyperPayPayment": "fas fa-credit-card",
        "learnnov_payments.DiscountCode": "fas fa-tags",
        "learnnov_payments.DiscountCodeUsage": "fas fa-receipt",
        "learnnov_payments.SubscriptionPlan": "fas fa-cubes",
        "learnnov_payments.UserSubscription": "fas fa-id-card",
        "learnnov_exams": "fas fa-clipboard-list",
        "learnnov_exams.MockExam": "fas fa-clipboard-list",
        "learnnov_exams.Question": "fas fa-question-circle",
        "learnnov_exams.Choice": "fas fa-check-circle",
        "learnnov_exams.ExamAttempt": "fas fa-user-clock",
        "learnnov_exams.StudentAnswer": "fas fa-check-double",
        "learnnov_certificates": "fas fa-certificate",
        "learnnov_certificates.GeneratedCertificate": "fas fa-certificate",
        "learnnov_certificates.SpecializationCertificate": "fas fa-award",
        "learnnov_certificates.CertificateQRCode": "fas fa-qrcode",
        "course_discussions": "fas fa-comments",
        "course_discussions.DiscussionThread": "fas fa-comments",
        "course_discussions.DiscussionPost": "fas fa-comment-dots",
        "ai_assistant": "fas fa-robot",
        "ai_assistant.ChatMessage": "fas fa-robot",
    },
    
    # Enable search in the UI
    "search_model": ["auth.User"],

    # Custom links
    "custom_links": {
        "academic_programs": [{
            "name": "مستشار الأمان الذكي", 
            "url": "security-advisor-ui", 
            "icon": "fas fa-shield-alt",
            "permissions": ["auth.view_user"]
        }]
    },

    # Custom RTL stylesheet and scripts
    "custom_css": "css/admin_rtl.css",
    "custom_js": "js/admin_rtl.js",
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-light",
    "accent": "accent-primary",
    "navbar": "navbar-white navbar-light",
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
    "theme": "litera",
    "default_theme_mode": "light",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-primary",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-primary"
    }
}

