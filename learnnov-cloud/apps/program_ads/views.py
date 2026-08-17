from rest_framework import generics, serializers, permissions
from .models import AdPlacement, Advertisement
from django.utils import timezone

class AdPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdPlacement
        fields = '__all__'

class AdvertisementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Advertisement
        fields = '__all__'

class ServeAdsView(generics.ListAPIView):
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        placement_slug = self.kwargs.get('placement_slug')
        return Advertisement.objects.filter(
            placement__slug=placement_slug,
            status='active',
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).order_by('priority', '-is_premium')

from .tasks import increment_program_ad_impressions_task, increment_program_ad_clicks_task
from rest_framework.response import Response
from rest_framework import status

class TrackAdImpressionView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, ad_id):
        increment_program_ad_impressions_task.delay(ad_id)
        return Response(status=status.HTTP_200_OK)

class TrackAdClickView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, ad_id):
        increment_program_ad_clicks_task.delay(ad_id)
        return Response(status=status.HTTP_200_OK)
