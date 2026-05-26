import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from django.db.models.functions import Greatest

from .models import ProgramApplication, UserReferral, ReferralReward
from .tasks import (
    send_application_status_notification_task,
    send_referral_reward_notification_task,
    update_program_applications_count_task
)

logger = logging.getLogger(__name__)

@receiver(post_save, sender=ProgramApplication)
def update_program_stats_on_save(sender, instance, created, **kwargs):
    """تحديث إحصاءات البرنامج في الخلفية عند الحفظ."""
    update_program_applications_count_task.delay(instance.program.id)

@receiver(post_delete, sender=ProgramApplication)
def update_program_stats_on_delete(sender, instance, **kwargs):
    """تحديث إحصاءات البرنامج عند الحذف."""
    update_program_applications_count_task.delay(instance.program.id)

@receiver(post_save, sender=ProgramApplication)
def handle_application_referral(sender, instance, created, **kwargs):
    """مكافأة المحيل بنقاط عند قبول الطلب المرجعي."""
    if instance.status == 'accepted' and instance.referral_code:
        # منع تكرار المكافأة للطلب الواحد
        if ReferralReward.objects.filter(application=instance).exists():
            return

        try:
            referrer_info = UserReferral.objects.get(code=instance.referral_code)
            # منع الطالب من إحالة نفسه
            if referrer_info.user == instance.applicant:
                return

            ReferralReward.objects.create(
                referrer=referrer_info,
                application=instance,
                points_awarded=50
            )

            # تحديث النقاط وعدادات الإحالة بشكل ذري (Atomic Update) لمنع مشاكل تزامن البيانات
            referrer_info.points = F('points') + 50
            referrer_info.total_referred = F('total_referred') + 1
            referrer_info.save(update_fields=['points', 'total_referred'])
            
            # إرسال إشعار للمحيل في الخلفية
            send_referral_reward_notification_task.delay(
                referrer_info.user.id, instance.applicant.id, instance.program.id
            )
            logger.info(f"Referral reward (50 pts) awarded to user {referrer_info.user.username} for applicant {instance.applicant.username}")
        except UserReferral.DoesNotExist:
            logger.warning(f"Referral code {instance.referral_code} does not exist.")
        except Exception as e:
            logger.error(f"Error handling referral for application {instance.id}: {e}")

@receiver(post_save, sender=ProgramApplication)
def handle_referral_reversal(sender, instance, created, **kwargs):
    """سحب نقاط المكافأة تلقائياً إذا تم تغيير الحالة من مقبول إلى أي حالة أخرى."""
    if not created and instance.status != 'accepted':
        reward = ReferralReward.objects.filter(application=instance).first()
        if reward:
            try:
                referrer = reward.referrer
                # سحب النقاط من المحيل بشكل ذري مع ضمان عدم نزول الرصيد تحت الصفر
                UserReferral.objects.filter(pk=referrer.pk).update(
                    points=Greatest(F('points') - reward.points_awarded, 0),
                    total_referred=Greatest(F('total_referred') - 1, 0)
                )
                # حذف سجل المكافأة
                reward.delete()
                logger.info(f"Referral reward reversed successfully for application {instance.id}")
            except Exception as e:
                logger.error(f"Error reversing referral reward: {e}")

@receiver(post_save, sender=ProgramApplication)
def notify_on_status_change(sender, instance, created, **kwargs):
    """إرسال إشعار للمتقدم في الخلفية عند تغيير الحالة فعلياً."""
    if created:
        return  # لا يتم إرسال إشعار عند الإنشاء الأولي بل ننتظر المراجعة والتحديث
    
    # يتم استدعاء خيط خلفي لإرسال البريد الإلكتروني
    if instance.status != 'submitted':
        send_application_status_notification_task.delay(instance.id)
