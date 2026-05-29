"""
LearnNov Cloud — URL Configuration.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.shortcuts import render


def landing_page(request):
    """الصفحة الرئيسية التسويقية."""
    from apps.academic_programs.models import AcademicProgram, ProgramProvider
    programs = AcademicProgram.objects.filter(
        is_active=True, status='active', is_featured=True
    ).select_related('provider')[:6]
    providers = ProgramProvider.objects.filter(is_active=True, is_verified=True)[:8]
    context = {
        'featured_programs': programs,
        'providers': providers,
        'total_programs': AcademicProgram.objects.filter(is_active=True).count(),
        'total_providers': ProgramProvider.objects.filter(is_active=True).count(),
    }
    return render(request, 'index.html', context)


def health_check(request):
    """فحص صحة النظام."""
    from django.db import connection
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        db_ok = False

    return JsonResponse({
        'status': 'healthy' if db_ok else 'degraded',
        'platform': 'LearnNov',
        'database': 'connected' if db_ok else 'disconnected',
    })


from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Landing
    path('', landing_page, name='home'),
    path('health/', health_check, name='health'),
    path('metrics/', include('django_prometheus.urls')),

    # Admin
    path('admin/', admin.site.urls),
    path('mfa/', include('mfa.urls')),

    # Auth JWT
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API
    path('api/programs/', include('apps.academic_programs.urls', namespace='academic_programs')),
    path('api/university-ads/', include('apps.university_ads.urls', namespace='university_ads')),
    path('api/payments/', include('apps.learnnov_payments.urls', namespace='learnnov_payments')),
    path('api/certificates/', include('apps.learnnov_certificates.urls', namespace='learnnov_certificates')),
    path('api/ads/', include('apps.program_ads.urls', namespace='program_ads')),
    path('api/exams/', include('apps.learnnov_exams.urls', namespace='learnnov_exams')),
    path('api/ai/', include('apps.ai_assistant.urls')),
    path('api/discussions/', include('apps.course_discussions.urls', namespace='course_discussions')),
]

from django.urls import re_path
from apps.core.views import SecureMediaView, StudentDashboardView, CourseViewerView

urlpatterns += [
    path('dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('course/<slug:slug>/watch/', CourseViewerView.as_view(), name='course-viewer'),
]

if settings.DEBUG:
    # Instead of exposing media publicly, route it through SecureMediaView
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', SecureMediaView.as_view(), name='secure-media'),
    ]

# ── Admin Branding ────────────────────────────────────────────────────────────
admin.site.site_header = "إدارة منصة LearnNov"
admin.site.site_title = "LearnNov Admin"
admin.site.index_title = "مرحباً بك في لوحة تحكم LearnNov"
