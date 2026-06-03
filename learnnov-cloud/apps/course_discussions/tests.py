from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.academic_programs.models import AcademicProgram, ProgramProvider, ProgramApplication
from apps.course_discussions.models import DiscussionThread, DiscussionPost

# Patch Django's Context copy methods to resolve Python 3.14 compatibility issue with Django 4.2
from django.template.context import RequestContext, Context
RequestContext.__copy__ = lambda self: self
Context.__copy__ = lambda self: self

User = get_user_model()

@override_settings(STATICFILES_STORAGE='django.contrib.staticfiles.storage.StaticFilesStorage')
class CourseDiscussionsSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
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
        
        self.student_enrolled = User.objects.create_user(username='enrolled_student', password='password123')
        self.student_not_enrolled = User.objects.create_user(username='not_enrolled_student', password='password123')
        self.instructor = User.objects.create_user(username='instructor_user', password='password123')
        self.instructor.is_staff = True
        self.instructor.save()
        
        # Enroll student
        ProgramApplication.objects.create(
            program=self.program,
            applicant=self.student_enrolled,
            status='enrolled',
            full_name='Enrolled Student',
            email='enrolled@learnnov.org',
            phone='+966500000001'
        )
        
        # Create thread
        self.thread = DiscussionThread.objects.create(
            program=self.program,
            author=self.student_enrolled,
            title='Thread Title',
            body='Thread body text'
        )

    def test_anonymous_user_blocked(self):
        url = reverse('course_discussions:thread-list-create', kwargs={'course_slug': self.program.slug})
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_non_enrolled_user_blocked(self):
        self.client.force_authenticate(user=self.student_not_enrolled)
        url = reverse('course_discussions:thread-list-create', kwargs={'course_slug': self.program.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_enrolled_user_can_access(self):
        self.client.force_authenticate(user=self.student_enrolled)
        url = reverse('course_discussions:thread-list-create', kwargs={'course_slug': self.program.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_instructor_can_access(self):
        self.client.force_authenticate(user=self.instructor)
        url = reverse('course_discussions:thread-list-create', kwargs={'course_slug': self.program.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_only_author_or_staff_can_modify_thread(self):
        # Authenticated as non-author (not enrolled either) -> blocked (403)
        self.client.force_authenticate(user=self.student_not_enrolled)
        url = reverse('course_discussions:thread-detail', kwargs={'course_slug': self.program.slug, 'pk': self.thread.id})
        response = self.client.patch(url, {'title': 'Updated Title', 'body': 'New body'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticated as enrolled but not author -> blocked (403)
        enrolled_non_author = User.objects.create_user(username='enrolled_non_author', password='password123')
        ProgramApplication.objects.create(
            program=self.program,
            applicant=enrolled_non_author,
            status='enrolled',
            full_name='Enrolled Non Author',
            email='nonauthor@learnnov.org',
            phone='+966500000002'
        )
        self.client.force_authenticate(user=enrolled_non_author)
        response = self.client.patch(url, {'title': 'Updated Title', 'body': 'New body'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticated as self.student_enrolled (the author) -> success
        self.client.force_authenticate(user=self.student_enrolled)
        response = self.client.patch(url, {'title': 'Updated Title', 'body': 'New body'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_reply_count_annotation_correct(self):
        # Create replies
        DiscussionPost.objects.create(thread=self.thread, author=self.student_enrolled, body="Reply 1")
        DiscussionPost.objects.create(thread=self.thread, author=self.student_enrolled, body="Reply 2")
        
        self.client.force_authenticate(user=self.student_enrolled)
        url = reverse('course_discussions:thread-list-create', kwargs={'course_slug': self.program.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify reply count in results (check pagination format)
        results = response.data.get('results', response.data)
        self.assertEqual(results[0]['reply_count'], 2)
