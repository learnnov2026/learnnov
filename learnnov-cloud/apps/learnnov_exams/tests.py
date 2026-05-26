from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.learnnov_exams.models import MockExam, Question, Choice, ExamAttempt

User = get_user_model()

class ExamLogicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        
        self.exam = MockExam.objects.create(
            title="Test Exam",
            time_limit_minutes=30,
            is_active=True
        )
        self.question = Question.objects.create(
            exam=self.exam,
            text="What is 2+2?",
            points=10
        )
        self.choice_correct = Choice.objects.create(
            question=self.question,
            text="4",
            is_correct=True
        )
        self.choice_wrong = Choice.objects.create(
            question=self.question,
            text="5",
            is_correct=False
        )
        
    def test_overdue_exam_submission_rejected(self):
        # Create an attempt that started 2 hours ago (well over 30 mins)
        attempt = ExamAttempt.objects.create(
            user=self.user,
            exam=self.exam
        )
        # Mock the start time to be in the past
        attempt.start_time = timezone.now() - timedelta(hours=2)
        attempt.save()

        url = reverse('learnnov_exams:submit_exam', kwargs={'attempt_id': attempt.id})
        data = {
            'answers': {
                str(self.question.id): self.choice_correct.id
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        # We modified the view to return 400 when severely overdue
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
