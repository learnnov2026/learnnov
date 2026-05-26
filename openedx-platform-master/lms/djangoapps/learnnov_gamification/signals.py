from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

# استيراد محاولة الامتحان بشكل آمن لمنع مشاكل الاستيراد الدائري
try:
    from lms.djangoapps.learnnov_exams.models import ExamAttempt
except ImportError:
    try:
        from learnnov_exams.models import ExamAttempt
    except ImportError:
        ExamAttempt = None

if ExamAttempt:
    @receiver(post_save, sender=ExamAttempt)
    def award_points_on_exam_completion(sender, instance, created, **kwargs):
        """منح نقاط للطالب بشكل آمن ومحمي عند إكمال الاختبار بنجاح."""
        if instance.is_completed:
            from .models import UserGamificationProfile, ExamPointsAwarded
            
            with transaction.atomic():
                # التحقق المسبق لمنع تكرار الاحتساب في حال استدعاء الإشارة عدة مرات
                if ExamPointsAwarded.objects.filter(attempt=instance).exists():
                    return
                
                # احتساب النقاط المكتسبة: 10 نقاط لإكمال الاختبار + مجموع نقاط إجاباته الصحيحة
                score_points = int(instance.score) if instance.score > 0 else 0
                points_to_award = 10 + score_points
                
                try:
                    # جلب أو إنشاء ملف النقاط والتحفيز للطالب
                    profile, created_profile = UserGamificationProfile.objects.get_or_create(user=instance.user)
                    
                    # تحديث النقاط بشكل ذري
                    profile.total_points = F('total_points') + points_to_award
                    profile.save(update_fields=['total_points'])
                    profile.refresh_from_db(fields=['total_points'])
                    
                    # تسجيل المكافأة في جدول الحماية لمنع أي تكرار مستقبلي
                    ExamPointsAwarded.objects.create(
                        attempt=instance,
                        points_awarded=points_to_award
                    )
                    
                    logger.info(
                        "Awarded %d gamification points to user %s for completing exam attempt %d",
                        points_to_award,
                        instance.user.username,
                        instance.id
                    )
                except Exception as e:
                    logger.error("Failed to award gamification points for exam attempt %d: %s", instance.id, str(e))
