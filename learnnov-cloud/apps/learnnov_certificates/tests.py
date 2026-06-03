from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
import uuid

from apps.learnnov_certificates.models import GeneratedCertificate, CertificateQRCode

# Patch Django's Context copy methods to resolve Python 3.14 compatibility issue with Django 4.2
from django.template.context import RequestContext, Context
RequestContext.__copy__ = lambda self: self
Context.__copy__ = lambda self: self

from django.test import override_settings

User = get_user_model()

@override_settings(STATICFILES_STORAGE='django.contrib.staticfiles.storage.StaticFilesStorage')
class CertificateLogicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='certuser', password='password123')
        self.client.force_authenticate(user=self.user)
        
        self.verify_uuid = uuid.uuid4().hex
        self.cert = GeneratedCertificate.objects.create(
            user=self.user,
            course_id='master-ai',
            course_name='ماجستير الذكاء الاصطناعي',
            grade='0.95',
            verify_uuid=self.verify_uuid,
            status='downloadable'
        )

    def test_generate_certificate(self):
        url = reverse('learnnov_certificates:generate-certificate')
        data = {
            'course_id': 'diploma-web',
            'course_name': 'دبلوم تطوير الويب',
            'grade': '98'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('verify_uuid', response.data)
        
        # Verify it exists in db
        db_cert = GeneratedCertificate.objects.get(verify_uuid=response.data['verify_uuid'])
        self.assertEqual(db_cert.course_id, 'diploma-web')
        self.assertEqual(db_cert.grade, '98')

    def test_certificate_verify_api(self):
        url = reverse('learnnov_certificates:verify_api', kwargs={'verify_uuid': self.verify_uuid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['is_valid'], True)
        self.assertEqual(response.data['course_id'], 'master-ai')
        self.assertIn('qr_image_url', response.data)

    def test_render_certificate_html(self):
        url = reverse('learnnov_certificates:render_certificate_html', kwargs={'verify_uuid': self.verify_uuid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, 'ماجستير الذكاء الاصطناعي')
        self.assertContains(response, 'د. خالد بن محمد')
        self.assertContains(response, 'أ. سارة الودعاني')

    def test_verify_certificate_html(self):
        url = reverse('learnnov_certificates:verify_certificate_html', kwargs={'verify_uuid': self.verify_uuid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, 'Valid Certificate')
        self.assertContains(response, 'certuser')
