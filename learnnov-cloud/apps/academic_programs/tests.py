from django.test import TestCase
from apps.academic_programs.serializers import AcademicProgramDetailSerializer
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.academic_programs.models import AcademicProgram, ProgramProvider, ProgramApplication

User = get_user_model()

class AcademicProgramSanitizationTests(TestCase):
    def test_xss_sanitization_in_program_description(self):
        # The malicious payload
        malicious_html = '<p>Welcome</p><script>alert("Hacked!");</script><a href="javascript:alert(1)">Click</a>'
        
        # Test the serializer validate_description method directly
        serializer = AcademicProgramDetailSerializer()
        
        cleaned_html = serializer.validate_description(malicious_html)
        
        # The script tag should be removed by bleach
        self.assertNotIn('<script>', cleaned_html)
        self.assertNotIn('alert("Hacked!");', cleaned_html)
        # The <p> tag should be kept
        self.assertIn('<p>Welcome</p>', cleaned_html)


class AcademicProgramApplicationSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='applicant_user', password='password123')
        
        self.provider = ProgramProvider.objects.create(name='Provider A', slug='prov-a')
        self.program = AcademicProgram.objects.create(
            provider=self.provider,
            title='Program A',
            slug='prog-a',
            tuition_fee=500.00,
            degree_level='diploma',
            status='active',
            is_active=True
        )
        
    def test_anonymous_application_rejected(self):
        url = reverse('academic_programs:program-apply', kwargs={'slug': self.program.slug})
        data = {
            'program': self.program.id,
            'full_name': 'Test Student',
            'email': 'student@learnnov.org',
            'phone': '+966500000000'
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_duplicate_application_returns_validation_error(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('academic_programs:program-apply', kwargs={'slug': self.program.slug})
        data = {
            'program': self.program.id,
            'full_name': 'Test Student',
            'email': 'student@learnnov.org',
            'phone': '+966500000000'
        }
        
        # First application submission: success
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Second application submission: raises ValidationError
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Under normal conditions Django DRF returns ValidationError. Under concurrency unique constraints raise IntegrityError caught by the view.
        # Either way we expect a 400 response.
        self.assertTrue(status.is_client_error(response.status_code))

    def test_specialization_listing_and_enrollment(self):
        from apps.academic_programs.models import Specialization, SpecializationCourse, SpecializationEnrollment
        
        spec = Specialization.objects.create(
            provider=self.provider,
            title='Integrated Specialization A',
            slug='spec-a',
            description='Integrated path for learning A'
        )
        SpecializationCourse.objects.create(specialization=spec, course=self.program, order=1)
        
        # Test Listing URL
        url_list = reverse('academic_programs:specializations-list')
        response_list = self.client.get(url_list)
        self.assertEqual(response_list.status_code, status.HTTP_200_OK)
        results = response_list.data.get('results') if isinstance(response_list.data, dict) else response_list.data
        self.assertGreaterEqual(len(results), 1)
        
        # Verify the created specialization is in the list
        spec_slugs = [s['slug'] for s in results]
        self.assertIn('spec-a', spec_slugs)
        
        # Test Detail URL
        url_detail = reverse('academic_programs:specialization-detail', kwargs={'slug': 'spec-a'})
        response_detail = self.client.get(url_detail)
        self.assertEqual(response_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(response_detail.data['courses'][0]['slug'], 'prog-a')
        
        # Test Enroll URL
        self.client.force_authenticate(user=self.user)
        url_enroll = reverse('academic_programs:specialization-enroll', kwargs={'slug': 'spec-a'})
        response_enroll = self.client.post(url_enroll)
        self.assertEqual(response_enroll.status_code, status.HTTP_200_OK)
        
        # Verify SpecializationEnrollment and ProgramApplication exist
        self.assertTrue(SpecializationEnrollment.objects.filter(user=self.user, specialization=spec).exists())
        self.assertTrue(ProgramApplication.objects.filter(applicant=self.user, program=self.program).exists())

