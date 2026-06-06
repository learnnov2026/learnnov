from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
import uuid

from apps.learnnov_certificates.models import GeneratedCertificate, CertificateQRCode

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

    def test_specialization_certificate_auto_generation(self):
        from apps.academic_programs.models import ProgramProvider, AcademicProgram, Specialization, SpecializationCourse, SpecializationEnrollment
        from apps.learnnov_certificates.models import SpecializationCertificate
        
        provider = ProgramProvider.objects.create(name='Provider B', slug='prov-b')
        c1 = AcademicProgram.objects.create(provider=provider, title='Course 1', slug='c1', degree_level='diploma', status='active')
        c2 = AcademicProgram.objects.create(provider=provider, title='Course 2', slug='c2', degree_level='diploma', status='active')
        
        spec = Specialization.objects.create(provider=provider, title='Spec B', slug='spec-b')
        SpecializationCourse.objects.create(specialization=spec, course=c1, order=1)
        SpecializationCourse.objects.create(specialization=spec, course=c2, order=2)
        
        SpecializationEnrollment.objects.create(user=self.user, specialization=spec, status='enrolled')
        
        url = reverse('learnnov_certificates:generate-certificate')
        self.client.post(url, {'course_id': 'c1', 'course_name': 'Course 1', 'grade': '90'}, format='json')
        
        self.assertFalse(SpecializationCertificate.objects.filter(user=self.user, specialization=spec).exists())
        
        self.client.post(url, {'course_id': 'c2', 'course_name': 'Course 2', 'grade': '95'}, format='json')
        
        self.assertTrue(SpecializationCertificate.objects.filter(user=self.user, specialization=spec).exists())
        spec_cert = SpecializationCertificate.objects.get(user=self.user, specialization=spec)
        self.assertEqual(spec_cert.status, 'downloadable')
        
        enroll = SpecializationEnrollment.objects.get(user=self.user, specialization=spec)
        self.assertEqual(enroll.status, 'completed')
        
        url_verify = reverse('learnnov_certificates:verify_api', kwargs={'verify_uuid': spec_cert.verify_uuid})
        response_verify = self.client.get(url_verify)
        self.assertEqual(response_verify.status_code, status.HTTP_200_OK)
        self.assertTrue(response_verify.data['is_specialization'])
        self.assertEqual(response_verify.data['specialization_title'], 'Spec B')

