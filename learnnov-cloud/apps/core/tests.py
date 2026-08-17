from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from apps.academic_programs.models import AcademicProgram, ProgramApplication, ProgramProvider, FieldOfStudy

User = get_user_model()


class CoreViewsTests(TestCase):
    def setUp(self):
        self.client = Client()

        # Create test provider & field
        self.provider = ProgramProvider.objects.create(
            name="LearnNov Academy",
            name_en="LearnNov Academy",
            slug="learnnov-academy",
        )
        self.field = FieldOfStudy.objects.create(
            name="علوم الحاسب",
            name_en="Computer Science",
            slug="computer-science",
        )

        # Create test program
        self.program = AcademicProgram.objects.create(
            title="AI Specialization",
            title_en="AI Specialization",
            slug="ai-specialization",
            provider=self.provider,
            field_of_study=self.field,
            degree_level="diploma",
            status="active",
            is_active=True,
        )

        # Create users
        self.student = User.objects.create_user(
            username="student1",
            password="password123",
            email="student1@learnnov.org"
        )
        self.enrolled_student = User.objects.create_user(
            username="student2",
            password="password123",
            email="student2@learnnov.org"
        )
        self.staff_user = User.objects.create_user(
            username="staff1",
            password="password123",
            email="staff1@learnnov.org",
            is_staff=True,
        )

        # Enroll student2
        ProgramApplication.objects.create(
            applicant=self.enrolled_student,
            program=self.program,
            status='enrolled',
            full_name='Student Two',
            email='student2@learnnov.org',
            phone='0500000000',
        )

    def test_student_dashboard_requires_login(self):
        response = self.client.get('/dashboard/')
        self.assertEqual(response.status_code, 302)

    def test_student_dashboard_access_for_authenticated_user(self):
        self.client.login(username='student1', password='password123')
        response = self.client.get('/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('active_courses', response.context)

    def test_course_viewer_permission_denied_for_non_enrolled_user(self):
        self.client.login(username='student1', password='password123')
        response = self.client.get(f'/course/{self.program.slug}/watch/')
        self.assertEqual(response.status_code, 403)

    def test_course_viewer_access_for_enrolled_user(self):
        self.client.login(username='student2', password='password123')
        response = self.client.get(f'/course/{self.program.slug}/watch/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['program'], self.program)

    def test_course_viewer_staff_bypass(self):
        self.client.login(username='staff1', password='password123')
        response = self.client.get(f'/course/{self.program.slug}/watch/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['program'], self.program)
