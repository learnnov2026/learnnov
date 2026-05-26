"""
خوارزمية استهداف الإعلانات — تختار الإعلان الأنسب للمستخدم.

الخوارزمية تستخدم نظام نقاط:
  - تطابق الجنس: +20
  - تطابق الدولة: +30
  - تطابق الاهتمامات: +15 لكل اهتمام مشترك
  - تطابق العمر: +10
  - إعلان مميز: +25
  - أولوية أعلى (رقم أصغر): +priority_score
  - معدل النقر CTR: +ctr * 5
النتيجة النهائية مع إضافة عشوائية صغيرة (±5) لتنويع الظهور.
"""
import random
import logging

from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

CACHE_TTL = 60  # ثانية


def _get_active_ads(placement_slug):
    """جلب الإعلانات النشطة من الكاش أو قاعدة البيانات."""
    cache_key = f'active_ads:{placement_slug}'
    ads = cache.get(cache_key)
    if ads is None:
        from .models import Advertisement
        now = timezone.now()
        ads = list(
            Advertisement.objects.filter(
                status='active',
                placement__slug=placement_slug,
                placement__is_active=True,
                start_date__lte=now,
                end_date__gte=now,
            ).select_related('placement')
        )
        cache.set(cache_key, ads, CACHE_TTL)
    return ads


def _score_ad(ad, user_profile):
    """احسب درجة تطابق الإعلان مع ملف المستخدم."""
    score = 0.0

    gender = user_profile.get('gender', 'all')
    if ad.target_gender == 'all' or ad.target_gender == gender:
        score += 20

    country = user_profile.get('country', '')
    if not ad.target_countries or country in ad.target_countries:
        score += 30

    age = user_profile.get('age', 0)
    if age and ad.target_age_min <= age <= (ad.target_age_max or 999):
        score += 10

    user_interests = set(user_profile.get('interests', []))
    ad_interests = set(ad.target_interests)
    overlap = user_interests & ad_interests
    score += len(overlap) * 15

    user_degrees = set(user_profile.get('degree_levels', []))
    ad_degrees = set(ad.target_degree_levels)
    if not ad_degrees or user_degrees & ad_degrees:
        score += 10

    if ad.is_premium:
        score += 25

    score += max(0, (11 - ad.priority) * 3)

    score += ad.ctr * 5

    score += random.uniform(-5, 5)

    return score


def select_ad(placement_slug, user=None, user_profile=None):
    """
    اختيار الإعلان الأنسب لمكان معين وملف مستخدم.

    Args:
        placement_slug: slug مكان الإعلان
        user: كائن المستخدم (اختياري)
        user_profile: قاموس يحتوي: gender, country, age, interests, degree_levels

    Returns:
        كائن Advertisement أو None
    """
    if user_profile is None:
        user_profile = {}

    if user and user.is_authenticated:
        try:
            # 1. جلب البيانات من ملف الشخصي (edX Profile)
            if hasattr(user, 'profile'):
                profile = user.profile
                user_profile.setdefault('gender', getattr(profile, 'gender', 'all'))
                user_profile.setdefault('country', getattr(profile, 'country', ''))
            
            # 2. استنتاج الاهتمامات من طلبات التقديم السابقة (LearnNov Logic)
            from lms.djangoapps.academic_programs.models import ProgramApplication
            user_apps = ProgramApplication.objects.filter(applicant=user).select_related('program')
            
            if 'interests' not in user_profile:
                # المجالات الدراسية التي قدم عليها الطالب تعتبر اهتماماته
                applied_fields = set(user_apps.values_list('program__field_of_study__slug', flat=True))
                user_profile['interests'] = list(applied_fields)
                
            if 'degree_levels' not in user_profile:
                # الدرجات العلمية التي يهتم بها
                applied_degrees = set(user_apps.values_list('program__degree_level', flat=True))
                user_profile['degree_levels'] = list(applied_degrees)
                
        except Exception:
            pass

    try:
        ads = _get_active_ads(placement_slug)
    except Exception as exc:
        logger.error('Error fetching ads for placement %s: %s', placement_slug, exc)
        return None

    if not ads:
        return None

    # تحسين: جلب إنفاق اليوم لكافة الإعلانات في استعلام واحد أو من الكاش لتقليل الضغط
    available = []
    from decimal import Decimal
    for ad in ads:
        if ad.daily_budget > Decimal('0'):
            today_spent = Decimal(str(_get_today_spent(ad.id)))
            if today_spent >= ad.daily_budget:
                continue
        if ad.total_budget > Decimal('0') and ad.total_spent >= ad.total_budget:
            continue
        available.append(ad)

    if not available:
        return None

    scored = [(ad, _score_ad(ad, user_profile)) for ad in available]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[0][0]


def _get_today_spent(ad_id):
    """إنفاق اليوم من الكاش."""
    cache_key = f'ad_daily_spent:{ad_id}:{timezone.now().date()}'
    spent = cache.get(cache_key)
    if spent is None:
        from .models import AdImpression
        from django.db.models import Count
        today = timezone.now().date()
        clicks = AdImpression.objects.filter(
            advertisement_id=ad_id,
            event_type='click',
            created_at__date=today
        ).count()
        try:
            from .models import Advertisement
            ad = Advertisement.objects.get(pk=ad_id)
            spent = float(ad.cost_per_click) * clicks
        except Exception:
            spent = 0
        cache.set(cache_key, spent, 300)
    return spent


def invalidate_placement_cache(placement_slug):
    """مسح الكاش عند تغيير الإعلانات."""
    cache.delete(f'active_ads:{placement_slug}')
