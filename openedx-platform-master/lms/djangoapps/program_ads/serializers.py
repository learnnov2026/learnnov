from rest_framework import serializers
from .models import AdPlacement, Advertisement, AdImpression


class AdPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdPlacement
        fields = ['id', 'name', 'slug', 'placement_type', 'max_width', 'max_height']


class AdvertisementPublicSerializer(serializers.ModelSerializer):
    """للواجهة الأمامية — بدون بيانات حساسة."""
    placement_slug = serializers.CharField(source='placement.slug', read_only=True)

    class Meta:
        model = Advertisement
        fields = [
            'id', 'ad_type', 'placement_slug',
            'image', 'video_url', 'html_content',
            'headline', 'body_text', 'call_to_action',
            'destination_url', 'alt_text',
        ]


class AdvertisementAdminSerializer(serializers.ModelSerializer):
    """للمشرفين — بيانات كاملة."""
    ctr = serializers.FloatField(read_only=True)
    placement_name = serializers.CharField(source='placement.name', read_only=True)

    class Meta:
        model = Advertisement
        fields = '__all__'
        read_only_fields = ['total_impressions', 'total_clicks', 'total_spent', 'created_at', 'updated_at']


class AdImpressionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdImpression
        fields = ['advertisement', 'event_type', 'session_key']

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['ip_address'] = _get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:500]
            validated_data['referrer'] = request.META.get('HTTP_REFERER', '')[:200]
            if request.user.is_authenticated:
                validated_data['user'] = request.user
        return super().create(validated_data)


def _get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
