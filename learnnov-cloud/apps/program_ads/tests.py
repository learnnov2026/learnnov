from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.utils import timezone
import datetime

from .models import AdPlacement, Advertisement


class ProgramAdsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.placement = AdPlacement.objects.create(
            name='Test Sidebar',
            slug='sidebar-test',
            placement_type='sidebar',
            is_active=True
        )
        now = timezone.now()
        self.ad = Advertisement.objects.create(
            title='Test Advertisement',
            advertiser_name='Advertiser A',
            advertiser_email='adv@example.com',
            placement=self.placement,
            destination_url='https://example.com',
            status='active',
            start_date=now - datetime.timedelta(days=1),
            end_date=now + datetime.timedelta(days=1),
        )

    def test_serve_ads_endpoint(self):
        url = reverse('program_ads:serve-ads', kwargs={'placement_slug': self.placement.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle paginated response
        if isinstance(response.data, dict) and 'results' in response.data:
            results = response.data['results']
        else:
            results = response.data
            
        ad_titles = [ad['title'] for ad in results]
        self.assertIn('Test Advertisement', ad_titles)

    def test_track_impression_endpoint(self):
        url = reverse('program_ads:track-impression', kwargs={'ad_id': self.ad.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database and check if incremented
        self.ad.refresh_from_db()
        self.assertEqual(self.ad.total_impressions, 1)

    def test_track_click_endpoint(self):
        url = reverse('program_ads:track-click', kwargs={'ad_id': self.ad.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database and check if incremented
        self.ad.refresh_from_db()
        self.assertEqual(self.ad.total_clicks, 1)
