from django.test import TestCase
from apps.academic_programs.serializers import AcademicProgramDetailSerializer
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.academic_programs.models import (
    AcademicProgram, ProgramProvider, ProgramApplication,
    ProgramModule, ProgramLesson, PeerAssignmentSubmission, PeerReviewAssessment
)

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


class FinancialAidTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='student_a', password='password123')
        self.admin = User.objects.create_superuser(username='admin_user', password='password123')
        self.provider = ProgramProvider.objects.create(name='Provider A', slug='prov-a')
        self.program = AcademicProgram.objects.create(
            provider=self.provider,
            title='Program A',
            slug='prog-a',
            tuition_fee=100.00,
            degree_level='diploma',
            status='active',
            is_active=True
        )

    def test_financial_aid_workflow(self):
        # 1. Anonymous user can't apply
        url_apply = reverse('academic_programs:financial-aid-apply')
        data = {
            'program': self.program.id,
            'reason_for_applying': 'I need support',
            'career_goals': 'Become a developer',
            'financial_situation': 'Low income'
        }
        response = self.client.post(url_apply, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Authenticated student can apply
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url_apply, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')

        # 3. Duplicate application is rejected
        response = self.client.post(url_apply, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Student can view their application
        url_my = reverse('academic_programs:financial-aid-my')
        response = self.client.get(url_my)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        app_id = results[0]['id']

        # 5. Non-admin cannot review
        url_review = reverse('academic_programs:financial-aid-review', kwargs={'pk': app_id})
        review_data = {
            'status': 'approved',
            'reviewer_notes': 'Valid case'
        }
        response = self.client.put(url_review, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 6. Admin can review and approve, and auto-enroll happens
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(url_review, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')

        # Verify auto-enrollment
        self.assertTrue(ProgramApplication.objects.filter(
            applicant=self.user,
            program=self.program,
            status='enrolled'
        ).exists())

        # Test Review List API
        url_review_list = reverse('academic_programs:financial-aid-review-list')
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url_review_list)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url_review_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)


class PeerReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='student_1', password='password123')
        self.user2 = User.objects.create_user(username='student_2', password='password123')
        self.user3 = User.objects.create_user(username='student_3', password='password123')
        self.user4 = User.objects.create_user(username='student_4', password='password123')
        self.user5 = User.objects.create_user(username='student_5', password='password123')
        self.provider = ProgramProvider.objects.create(name='Provider A', slug='prov-a')
        self.program = AcademicProgram.objects.create(
            provider=self.provider,
            title='Program A',
            slug='prog-a',
            tuition_fee=0.00,
            degree_level='diploma',
            status='active',
            is_active=True
        )
        self.module = ProgramModule.objects.create(
            program=self.program,
            title='Module 1',
            order=1
        )
        self.lesson = ProgramLesson.objects.create(
            module=self.module,
            title='Peer Assignment Lesson',
            lesson_type='peer_assignment',
            order=1
        )

    def test_peer_review_workflow(self):
        # 1. Test student_1 submits assignment
        self.client.force_authenticate(user=self.user1)
        url_submit = reverse('academic_programs:peer-submission-submit')
        submit_data = {
            'lesson': self.lesson.id,
            'submission_text': 'This is my peer assignment submission by student 1.'
        }
        response = self.client.post(url_submit, submit_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['submission_text'], submit_data['submission_text'])
        student_1_sub_id = response.data['id']

        # Try to submit duplicate - should fail
        response = self.client.post(url_submit, submit_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Check status for student_1 (should not be completed yet because 0 reviews given)
        url_status = reverse('academic_programs:peer-review-status')
        response = self.client.get(f"{url_status}?lesson_id={self.lesson.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_submitted'])
        self.assertEqual(response.data['reviews_given_count'], 0)
        self.assertEqual(response.data['reviews_received_count'], 0)
        self.assertFalse(response.data['is_completed'])

        # 2. Try to get a random submission for student_1 to review - should return 404 (only their own exists)
        url_random = reverse('academic_programs:peer-review-random')
        response = self.client.get(f"{url_random}?lesson_id={self.lesson.id}")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # 3. Student 2 submits assignment
        self.client.force_authenticate(user=self.user2)
        submit_data_2 = {
            'lesson': self.lesson.id,
            'submission_text': 'Submission by student 2.'
        }
        response = self.client.post(url_submit, submit_data_2, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        student_2_sub_id = response.data['id']

        # 4. Now student 1 retrieves a random assignment (should get student 2's submission)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"{url_random}?lesson_id={self.lesson.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], student_2_sub_id)

        # 5. Student 1 reviews Student 2
        url_review = reverse('academic_programs:peer-review-submit')
        review_data = {
            'submission': student_2_sub_id,
            'score': 4,
            'feedback': 'Great work!'
        }
        response = self.client.post(url_review, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Try to review own submission (student 1 reviewing student 1 should fail)
        review_own_data = {
            'submission': student_1_sub_id,
            'score': 5,
            'feedback': 'Excellent'
        }
        response = self.client.post(url_review, review_own_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Try to review Student 2 again - should fail
        response = self.client.post(url_review, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 6. Verify status for Student 2 (should show 1 review received)
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(f"{url_status}?lesson_id={self.lesson.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reviews_received_count'], 1)
        self.assertEqual(response.data['average_score'], 4.0)
        self.assertEqual(len(response.data['feedbacks']), 1)
        self.assertEqual(response.data['feedbacks'][0]['feedback'], 'Great work!')

        # 7. Check completion rules (student 1 reviews 2 more peers)
        # We need student 3 and student 4 to submit their assignments
        self.client.force_authenticate(user=self.user3)
        self.client.post(url_submit, {'lesson': self.lesson.id, 'submission_text': 'Sub 3'}, format='json')
        student_3_sub_id = PeerAssignmentSubmission.objects.get(student=self.user3, lesson=self.lesson).id

        self.client.force_authenticate(user=self.user4)
        self.client.post(url_submit, {'lesson': self.lesson.id, 'submission_text': 'Sub 4'}, format='json')
        student_4_sub_id = PeerAssignmentSubmission.objects.get(student=self.user4, lesson=self.lesson).id

        # Student 1 reviews student 3 and student 4
        self.client.force_authenticate(user=self.user1)
        self.client.post(url_review, {'submission': student_3_sub_id, 'score': 5, 'feedback': 'Good'}, format='json')
        self.client.post(url_review, {'submission': student_4_sub_id, 'score': 3, 'feedback': 'Ok'}, format='json')

        # Now Student 1 status should be is_completed = True
        response = self.client.get(f"{url_status}?lesson_id={self.lesson.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reviews_given_count'], 3)
        self.assertTrue(response.data['is_completed'])




