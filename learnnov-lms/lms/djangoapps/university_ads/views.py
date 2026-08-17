from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import get_language
from django.views.decorators.http import require_POST

from .models import AdClick, AdImpression, AdPlacement, UniversityAd


def _get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def active_ads(request):
    """Return active ads JSON for a given placement, respecting current language."""
    placement = request.GET.get('placement', AdPlacement.DASHBOARD_TOP)
    lang = get_language() or 'ar'
    now = timezone.now()
    ads = UniversityAd.objects.filter(
        is_active=True,
        placement=placement,
        start_date__lte=now,
        end_date__gte=now,
    ).select_related('university').order_by('priority')

    result = []
    for ad in ads:
        if ad.max_impressions > 0 and ad.total_impressions >= ad.max_impressions:
            continue
        result.append({
            'id': ad.id,
            'title': ad.get_title(lang),
            'description': ad.get_description(lang),
            'image_url': request.build_absolute_uri(ad.image.url) if ad.image else '',
            'link_url': ad.link_url,
            'university_name': ad.university.display_name(lang),
            'university_logo': (
                request.build_absolute_uri(ad.university.logo.url)
                if ad.university.logo else ''
            ),
            'placement': ad.placement,
        })

    return JsonResponse({'ads': result})


def _get_cache_key(request, ad_id, event_type):
    session_key = getattr(request.session, 'session_key', None)
    if not session_key:
        ip = _get_client_ip(request) or 'anon'
        ua = request.META.get('HTTP_USER_AGENT', '')
        import hashlib
        session_key = f"anon:{hashlib.md5(f'{ip}:{ua}'.encode('utf-8')).hexdigest()}"
    return f'univ_ad_limit:{ad_id}:{event_type}:{session_key}'


@require_POST
def track_impression(request, ad_id):
    from django.core.cache import cache
    cache_key = _get_cache_key(request, ad_id, 'impression')
    if cache.get(cache_key):
        return JsonResponse({'status': 'ignored', 'detail': 'تم تسجيل الحدث مؤخراً.'})

    ad = get_object_or_404(UniversityAd, id=ad_id, is_active=True)
    AdImpression.objects.create(
        ad=ad,
        user=request.user if request.user.is_authenticated else None,
        ip_address=_get_client_ip(request),
        page=request.POST.get('page', ''),
    )
    # منع تكرار التسجيل لمدة 10 دقائق للانطباع
    cache.set(cache_key, True, 600)
    return JsonResponse({'status': 'ok'})


@require_POST
def track_click(request, ad_id):
    from django.core.cache import cache
    cache_key = _get_cache_key(request, ad_id, 'click')
    if cache.get(cache_key):
        ad = get_object_or_404(UniversityAd, id=ad_id, is_active=True)
        return JsonResponse({'status': 'ignored', 'redirect_url': ad.link_url})

    ad = get_object_or_404(UniversityAd, id=ad_id, is_active=True)
    AdClick.objects.create(
        ad=ad,
        user=request.user if request.user.is_authenticated else None,
        ip_address=_get_client_ip(request),
    )
    # منع تكرار التسجيل لمدة ساعة للنقرة
    cache.set(cache_key, True, 3600)
    return JsonResponse({'status': 'ok', 'redirect_url': ad.link_url})
