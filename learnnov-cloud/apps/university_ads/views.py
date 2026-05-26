from rest_framework import generics, serializers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.utils.translation import get_language

from .models import University, UniversityAd, AdImpression, AdClick
from .tasks import increment_ad_impressions_task, increment_ad_clicks_task


# ── Serializers ───────────────────────────────────────────────────────────────

class UniversitySerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = University
        fields = ['id', 'name', 'name_ar', 'display_name', 'logo', 'website']

    def get_display_name(self, obj):
        lang = get_language() or 'ar'
        return obj.display_name(lang)


class UniversityAdSerializer(serializers.ModelSerializer):
    university_name = serializers.SerializerMethodField()
    university_logo = serializers.SerializerMethodField()
    display_title = serializers.SerializerMethodField()
    display_description = serializers.SerializerMethodField()

    class Meta:
        model = UniversityAd
        fields = [
            'id', 'university_name', 'university_logo', 'title', 'title_ar', 
            'display_title', 'description', 'description_ar', 'display_description', 
            'image', 'link_url', 'placement', 'priority'
        ]

    def get_university_name(self, obj):
        lang = get_language() or 'ar'
        return obj.university.display_name(lang)

    def get_university_logo(self, obj):
        request = self.context.get('request')
        if obj.university.logo and request:
            return request.build_absolute_uri(obj.university.logo.url)
        return ''

    def get_display_title(self, obj):
        lang = get_language() or 'ar'
        return obj.get_title(lang)

    def get_display_description(self, obj):
        lang = get_language() or 'ar'
        return obj.get_description(lang)


# ── Views ─────────────────────────────────────────────────────────────────────

class UniversityListView(generics.ListAPIView):
    queryset = University.objects.filter(is_active=True)
    serializer_class = UniversitySerializer
    permission_classes = [permissions.AllowAny]


class AdListView(generics.ListAPIView):
    """عرض الإعلانات النشطة بناءً على الموضع واللغة الحالية."""
    serializer_class = UniversityAdSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        now = timezone.now()
        qs = UniversityAd.objects.filter(is_active=True, start_date__lte=now, end_date__gte=now).select_related('university')
        
        # فلترة حسب مكان الإعلان
        placement = self.request.query_params.get('placement')
        if placement:
            qs = qs.filter(placement=placement)
            
        # فلترة الإعلانات التي تجاوزت الحد الأقصى للمشاهدات
        active_ads = []
        for ad in qs:
            if ad.max_impressions > 0 and ad.impressions_count >= ad.max_impressions:
                continue
            active_ads.append(ad.id)
            
        return UniversityAd.objects.filter(id__in=active_ads).select_related('university').order_by('priority')


# ── Analytics Tracking Views ──────────────────────────────────────────────────

def _get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class TrackImpressionAPIView(APIView):
    """تسجيل مشاهدة الإعلان بشكل فوري وآمن."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, ad_id):
        ad = get_object_or_404(UniversityAd, id=ad_id, is_active=True)
        
        # إنشاء سجل المشاهدة التفصيلي
        AdImpression.objects.create(
            ad=ad,
            user=request.user if request.user.is_authenticated else None,
            ip_address=_get_client_ip(request),
            page=request.data.get('page', '')
        )
        
        # تحديث عداد المشاهدات atomically في الخلفية لمنع البطء
        increment_ad_impressions_task.delay(ad.id)
        
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class TrackClickAPIView(APIView):
    """تسجيل نقرة الإعلان وتحويل الطالب للرابط."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, ad_id):
        ad = get_object_or_404(UniversityAd, id=ad_id, is_active=True)
        
        # إنشاء سجل النقرة التفصيلي
        AdClick.objects.create(
            ad=ad,
            user=request.user if request.user.is_authenticated else None,
            ip_address=_get_client_ip(request)
        )
        
        # تحديث عداد النقرات atomically في الخلفية
        increment_ad_clicks_task.delay(ad.id)
        
        return Response({'status': 'ok', 'redirect_url': ad.link_url}, status=status.HTTP_200_OK)
