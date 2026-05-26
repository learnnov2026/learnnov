import os
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import MockExam, Question, Choice, ExamAttempt
from rest_framework.test import APIClient

User = get_user_model()

class ExamLogicTest(TestCase):
    def setUp(self):
password = os.getenv('password')  # moved to .env
        self.exam = MockExam.objects.create(
            title='Quick Quiz',
            time_limit_minutes=1, # دقيقة واحدة فقط للاختبار
            course_id='course-v1:Test+T1+2026'
        )
        self.q = Question.objects.create(exam=self.exam, text='1+1?', points=10)
        self.c_correct = Choice.objects.create(question=self.q, text='2', is_correct=True)
        self.c_wrong = Choice.objects.create(question=self.q, text='3', is_correct=False)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_overdue_penalty(self):
        """اختبار عقوبة التأخير الشديد (تصفير الدرجة)."""
        attempt = ExamAttempt.objects.create(user=self.user, exam=self.exam)
        
        # محاكاة مرور وقت كبير (ساعتين)
        attempt.start_time = timezone.now() - timezone.timedelta(hours=2)
        attempt.save()
        
        # محاولة تسليم الإجابة الصحيحة
        url = f'/api/exams/attempts/{attempt.id}/submit/'
        response = self.client.post(url, {'answers': {str(self.q.id): self.c_correct.id}}, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['final_score'], 0) # يجب أن تكون صفر بسبب التأخير
        
    def test_normal_submission(self):
        """اختبار التسليم الطبيعي واحتساب الدرجة."""
        attempt = ExamAttempt.objects.create(user=self.user, exam=self.exam)
        url = f'/api/exams/attempts/{attempt.id}/submit/'
        response = self.client.post(url, {'answers': {str(self.q.id): self.c_correct.id}}, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['final_score'], 10)
