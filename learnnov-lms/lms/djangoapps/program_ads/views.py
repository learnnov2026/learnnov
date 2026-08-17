import logging

from django.db.models import F, Q
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import AdPlacement, Advertisement, AdImpression
from .serializers import (
    AdPlacementSerializer, AdvertisementPublicSerializer,
    AdvertisementAdminSerializer, AdImpressionSerializer,
)
from .targeting import select_ad, invalidate_placement_cache

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def serve_ad(request, placement_slug):
    """
    الواجهة الرئيسية: يُعيد الإعلان الأنسب لمكان معين.
    GET /api/ads/serve/<placement_slug>/
    query params: gender, country, age, interests (comma-sep), degrees (comma-sep)
    """
    user_profile = {
        'gender': request.query_params.get('gender', 'all'),
        'country': request.query_params.get('country', ''),
        'age': _safe_int(request.query_params.get('age', 0)),
        'interests': _split(request.query_params.get('interests', '')),
        'degree_levels': _split(request.query_params.get('degrees', '')),
    }

    user = request.user if request.user.is_authenticated else None
    ad = select_ad(placement_slug, user=user, user_profile=user_profile)

    if ad is None:
        return Response({'detail': 'لا يوجد إعلان متاح.'}, status=status.HTTP_204_NO_CONTENT)

    # تسجيل الظهور تلقائياً
    _record_event(request, ad, 'impression')

    serializer = AdvertisementPublicSerializer(ad, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def record_impression(request):
    """تسجيل ظهور أو نقرة يدوياً من الواجهة الأمامية."""
    serializer = AdImpressionSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    ad = data['advertisement']
    event_type = data['event_type']

    from django.core.cache import cache
    session_key = getattr(request.session, 'session_key', None)
    if not session_key:
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'anon'))
        if ',' in ip:
            ip = ip.split(',')[0].strip()
        ua = request.META.get('HTTP_USER_AGENT', '')
        import hashlib
        session_key = f"anon:{hashlib.md5(f'{ip}:{ua}'.encode('utf-8')).hexdigest()}"

    cache_key = f'ad_event_limit:{ad.id}:{event_type}:{session_key}'

    if cache.get(cache_key):
        return Response({'status': 'ignored', 'detail': 'تم تسجيل الحدث مؤخراً.'}, status=status.HTTP_200_OK)

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    if ',' in ip:
        ip = ip.split(',')[0].strip()

    from .tasks import record_ad_event_task
    record_ad_event_task.delay(
        ad_id=ad.id,
        event_type=event_type,
        user_id=request.user.id if request.user.is_authenticated else None,
        ip_address=ip or None,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        referrer=request.META.get('HTTP_REFERER', '')[:200],
        session_key=request.session.session_key or ''
    )

    timeout = 600 if event_type == 'impression' else 3600
    cache.set(cache_key, True, timeout)

    return Response({'status': 'queued'}, status=status.HTTP_202_ACCEPTED)


# --- Admin Views ---

class PlacementListView(generics.ListCreateAPIView):
    serializer_class = AdPlacementSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = AdPlacement.objects.all()


class AdvertisementListView(generics.ListCreateAPIView):
    serializer_class = AdvertisementAdminSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Advertisement.objects.select_related('placement')
        status_filter = self.request.query_params.get('status')
        placement = self.request.query_params.get('placement')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if placement:
            qs = qs.filter(placement__slug=placement)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdvertisementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdvertisementAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Advertisement.objects.all()

    def perform_update(self, serializer):
        instance = serializer.save()
        invalidate_placement_cache(instance.placement.slug)

    def perform_destroy(self, instance):
        placement_slug = instance.placement.slug
        instance.delete()
        invalidate_placement_cache(placement_slug)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def approve_ad(request, pk):
    """الموافقة على إعلان وتفعيله."""
    try:
        ad = Advertisement.objects.get(pk=pk)
    except Advertisement.DoesNotExist:
        return Response({'detail': 'الإعلان غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

    if ad.status not in ('pending', 'draft'):
        return Response({'detail': 'لا يمكن الموافقة على هذا الإعلان.'}, status=status.HTTP_400_BAD_REQUEST)

    ad.status = 'approved'
    ad.reviewer_notes = request.data.get('notes', '')
    ad.save(update_fields=['status', 'reviewer_notes'])
    invalidate_placement_cache(ad.placement.slug)
    return Response({'status': 'approved'})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def activate_ad(request, pk):
    """تشغيل إعلان موافق عليه."""
    try:
        ad = Advertisement.objects.get(pk=pk)
    except Advertisement.DoesNotExist:
        return Response({'detail': 'الإعلان غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

    if ad.status != 'approved':
        return Response({'detail': 'يجب الموافقة على الإعلان أولاً.'}, status=status.HTTP_400_BAD_REQUEST)

    ad.status = 'active'
    ad.save(update_fields=['status'])
    invalidate_placement_cache(ad.placement.slug)
    return Response({'status': 'active'})


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def ad_analytics(request, pk):
    """إحصاءات إعلان محدد."""
    from django.db.models import Count
    from django.utils import timezone
    import datetime

    try:
        ad = Advertisement.objects.get(pk=pk)
    except Advertisement.DoesNotExist:
        return Response({'detail': 'الإعلان غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

    from django.db.models.functions import TruncDay
    last_30 = timezone.now() - datetime.timedelta(days=30)
    daily = (
        AdImpression.objects.filter(advertisement=ad, created_at__gte=last_30)
        .annotate(day=TruncDay('created_at'))
        .values('day', 'event_type')
        .annotate(count=Count('id'))
        .order_by('day')
    )

    return Response({
        'id': ad.id,
        'title': ad.title,
        'status': ad.status,
        'total_impressions': ad.total_impressions,
        'total_clicks': ad.total_clicks,
        'ctr': ad.ctr,
        'total_spent': str(ad.total_spent),
        'daily_breakdown': list(daily),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def ads_dashboard(request):
    """لوحة تحكم إجمالية للإعلانات."""
    from django.db.models import Sum, Count
    from django.utils import timezone

    today = timezone.now().date()
    stats = Advertisement.objects.aggregate(
        total_ads=Count('id'),
        active_ads=Count('id', filter=Q(status='active')),
        total_impressions=Sum('total_impressions'),
        total_clicks=Sum('total_clicks'),
        total_revenue=Sum('total_spent'),
    )

    pending_review = Advertisement.objects.filter(status='pending').count()
    stats['pending_review'] = pending_review
    stats['date'] = today

    return Response(stats)


# --- Helpers ---

def _record_event(request, ad, event_type):
    try:
        from django.core.cache import cache
        session_key = getattr(request.session, 'session_key', None)
        if not session_key:
            # الحصول على الـ IP الحقيقي بشكل دقيق
            ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'anon'))
            if ',' in ip:
                ip = ip.split(',')[0].strip()
            ua = request.META.get('HTTP_USER_AGENT', '')
            import hashlib
            # استخدام هاش لـ IP والـ User Agent لتمييز الزوار المجهولين ومنع تداخل الكاش بينهم
            session_key = f"anon:{hashlib.md5(f'{ip}:{ua}'.encode('utf-8')).hexdigest()}"
        
        cache_key = f'ad_event_limit:{ad.id}:{event_type}:{session_key}'
        
        if cache.get(cache_key):
            return # تم تسجيل هذا الحدث مؤخراً، تجاهله
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ',' in ip:
            ip = ip.split(',')[0].strip()
            
        from .tasks import record_ad_event_task
        record_ad_event_task.delay(
            ad_id=ad.id,
            event_type=event_type,
            user_id=request.user.id if request.user.is_authenticated else None,
            ip_address=ip or None,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            referrer=request.META.get('HTTP_REFERER', '')[:200],
            session_key=request.session.session_key or ''
        )
        
        # منع تكرار التسجيل لمدة 10 دقائق للانطباع و ساعة للنقرة
        timeout = 600 if event_type == 'impression' else 3600
        cache.set(cache_key, True, timeout)
    except Exception:
        logger.exception("Failed to queue ad event task")


def _safe_int(val):
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0


def _split(val):
    if not val:
        return []
    return [v.strip() for v in val.split(',') if v.strip()]
