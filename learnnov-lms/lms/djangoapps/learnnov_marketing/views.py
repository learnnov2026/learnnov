from django.shortcuts import render
from django.utils.translation import get_language
from django.core.exceptions import PermissionDenied
from lms.djangoapps.academic_programs.models import AcademicProgram
from lms.djangoapps.university_ads.models import UniversityAd, AdPlacement


def index(request):
    """
    الصفحة الرئيسية التسويقية للمنصة.
    """
    from django.utils import timezone
    lang = get_language() or 'ar'
    now = timezone.now()

    # التقاط كود الإحالة من الرابط وحفظه في الجلسة
    ref_code = request.GET.get('ref')
    if ref_code:
        request.session['referral_code'] = ref_code

    # جلب البرامج المميزة
    featured_programs = AcademicProgram.objects.filter(
        is_active=True, status='active', is_featured=True
    ).select_related('provider')[:6]

    # جلب إعلانات الجامعات (البانر العلوي) - مفلترة بالتاريخ ونشطة وعشوائية
    top_ads = UniversityAd.objects.filter(
        is_active=True, 
        placement=AdPlacement.DASHBOARD_TOP,
        start_date__lte=now,
        end_date__gte=now
    ).select_related('university').order_by('?')[:3]

    context = {
        'featured_programs': featured_programs,
        'top_ads': top_ads,
        'lang': lang,
    }
    return render(request, 'learnnov_marketing/index.html', context)


def handler404(request, exception=None):
    """صفحة 404 المخصصة لمنصة LearnNov."""
    return render(request, 'learnnov_marketing/404.html', status=404)


def admin_insights(request):
    """عرض لوحة التحليلات المتقدمة للممشرفين."""
    if not request.user.is_staff:
        raise PermissionDenied
    return render(request, 'learnnov_marketing/admin_insights.html')


def program_detail(request, slug):
    """صفحة تفاصيل البرنامج (لأغراض SEO والتحميل الأولي)."""
    from django.shortcuts import get_object_or_404
    program = get_object_or_404(AcademicProgram, slug=slug, is_active=True)

    # زيادة عداد المشاهدات
    program.increment_views()

    # Safely build meta_image URL
    meta_image = None
    if program.cover_image:
        try:
            meta_image = request.build_absolute_uri(program.cover_image.url)
        except Exception:
            meta_image = None

    context = {
        'program': program,
        'meta_title': f"{program.title} | {program.provider.name}",
        'meta_description': program.description[:160],
        'meta_image': meta_image,
    }
    return render(request, 'learnnov_marketing/program_detail.html', context)
