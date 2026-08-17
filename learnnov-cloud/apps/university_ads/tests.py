from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta

from apps.university_ads.models import University, UniversityAd, AdPlacement, AdImpression, AdClick

User = get_user_model()


class UniversityModelTests(TestCase):
    def setUp(self):
        self.university = University.objects.create(
            name="King Saud University",
            name_ar="جامعة الملك سعود",
            website="https://ksu.edu.sa"
        )

    def test_university_creation_and_str(self):
        self.assertEqual(str(self.university), "جامعة الملك سعود")
        self.assertEqual(self.university.display_name('ar'), "جامعة الملك سعود")
        self.assertEqual(self.university.display_name('en'), "King Saud University")


class UniversityAdModelTests(TestCase):
    def setUp(self):
        self.university = University.objects.create(
            name="King Abdulaziz University",
            name_ar="جامعة الملك عبدالعزيز"
        )
        now = timezone.now()
        self.ad = UniversityAd.objects.create(
            university=self.university,
            title="Master Program",
            title_ar="برنامج الماجستير",
            description="Apply now for Fall 2026",
            description_ar="سجل الآن لفصل الخريف 2026",
            image="university_ads/test.jpg",
            link_url="https://kau.edu.sa/apply",
            placement=AdPlacement.DASHBOARD_TOP,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=10),
            max_impressions=100
        )

    def test_ad_bilingual_titles_and_descriptions(self):
        self.assertEqual(self.ad.get_title('ar'), "برنامج الماجستير")
        self.assertEqual(self.ad.get_title('en'), "Master Program")
        self.assertEqual(self.ad.get_description('ar'), "سجل الآن لفصل الخريف 2026")
        self.assertEqual(self.ad.get_description('en'), "Apply now for Fall 2026")

    def test_ad_is_currently_active(self):
        self.assertTrue(self.ad.is_currently_active())

        # Test expired ad
        self.ad.end_date = timezone.now() - timedelta(days=1)
        self.ad.save()
        self.assertFalse(self.ad.is_currently_active())

    def test_ctr_calculation(self):
        self.assertEqual(self.ad.ctr, 0.0)
        self.ad.impressions_count = 100
        self.ad.clicks_count = 5
        self.ad.save()
        self.assertEqual(self.ad.ctr, 5.0)


class UniversityAdsAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.university = University.objects.create(
            name="Princess Nourah University",
            name_ar="جامعة الأميرة نورة",
            is_active=True
        )
        now = timezone.now()
        self.ad = UniversityAd.objects.create(
            university=self.university,
            title="Diploma Program",
            title_ar="برنامج الدبلوم",
            image="university_ads/diploma.jpg",
            link_url="https://pnu.edu.sa",
            placement=AdPlacement.DASHBOARD_TOP,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=5),
            is_active=True
        )

    def test_list_universities(self):
        response = self.client.get('/api/ads/universities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_ads_with_placement_filter(self):
        response = self.client.get(f'/api/ads/?placement={AdPlacement.DASHBOARD_TOP}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('apps.university_ads.tasks.increment_ad_impressions_task.delay')
    def test_track_impression(self, mock_celery_task):
        response = self.client.post(f'/api/ads/{self.ad.id}/impression/', {'page': 'dashboard'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(AdImpression.objects.filter(ad=self.ad).count(), 1)
        mock_celery_task.assert_called_once_with(self.ad.id)

    @patch('apps.university_ads.tasks.increment_ad_clicks_task.delay')
    def test_track_click(self, mock_celery_task):
        response = self.client.post(f'/api/ads/{self.ad.id}/click/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['redirect_url'], self.ad.link_url)
        self.assertEqual(AdClick.objects.filter(ad=self.ad).count(), 1)
        mock_celery_task.assert_called_once_with(self.ad.id)
