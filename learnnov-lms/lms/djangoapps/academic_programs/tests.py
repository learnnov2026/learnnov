import os
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import ProgramProvider, AcademicProgram, ProgramApplication, UserReferral, ReferralReward

User = get_user_model()

@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class AcademicProgramsLogicTest(TestCase):
    def setUp(self):
        # إعداد البيانات الأساسية
        self.provider = ProgramProvider.objects.create(
            name='Test University',
            slug='test-uni',
            is_active=True
        )
        self.program = AcademicProgram.objects.create(
            provider=self.provider,
            title='Test Program',
            slug='test-prog',
            status='active',
            is_active=True,
            max_students=2,
            application_deadline=timezone.now() + timezone.timedelta(days=10)
        )
password = os.getenv('password')  # moved to .env
password = os.getenv('password')  # moved to .env

    def test_referral_reward_on_acceptance(self):
        """اختبار منح المكافأة عند قبول الطالب."""
        # إنشاء كود إحالة للمحيل
        ref, _ = UserReferral.generate_code_for_user(self.referrer)
        
        # تقديم طلب باستخدام الكود
        app = ProgramApplication.objects.create(
            applicant=self.student,
            program=self.program,
            referral_code=ref.code,
            status='submitted'
        )
        
        # التأكد من عدم وجود مكافأة بعد
        self.assertEqual(ReferralReward.objects.count(), 0)
        
        # تغيير الحالة إلى مقبول
        app.status = 'accepted'
        app.save()
        
        # التحقق من منح المكافأة (عبر Signals)
        self.assertEqual(ReferralReward.objects.count(), 1)
        ref.refresh_from_db()
        self.assertEqual(ref.points, 50)

    def test_capacity_limit(self):
        """اختبار حدود الاستيعاب للبرنامج."""
        # البرنامج يستوعب 2 فقط
        self.assertTrue(self.program.is_open_for_applications)
        
        # قبول طالبين
        for i in range(2):
            u = User.objects.create_user(username=f'u{i}', email=f'u{i}@t.com')
            ProgramApplication.objects.create(
                applicant=u, program=self.program, status='accepted'
            )
        
        # تحديث عداد البرنامج (عبر Signals/Tasks)
        # ملاحظة: في الاختبارات سنقوم بتحديث العداد يدوياً أو انتظار السيجنال إذا كان متزامناً
        # قمنا بتعديل السيجنال ليستخدم delay() في الكود الحقيقي، لكن في الاختبارات سنقوم بالتأكد من المنطق
        self.program.accepted_count = self.program.applications.filter(status='accepted').count()
        self.program.save()

        # يجب أن يغلق البرنامج الآن
        self.assertFalse(self.program.is_open_for_applications)

    def test_deadline_enforcement(self):
        """اختبار انتهاء الموعد النهائي."""
        self.program.application_deadline = timezone.now() - timezone.timedelta(days=1)
        self.program.save()
        self.assertFalse(self.program.is_open_for_applications)
