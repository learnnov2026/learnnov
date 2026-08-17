from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from .models import ProgramApplication, UserReferral

from .tasks import (
    send_application_status_notification_task,
    send_referral_reward_notification_task,
    update_program_applications_count_task
)

@receiver(post_save, sender=ProgramApplication)
def update_program_stats_on_save(sender, instance, created, **kwargs):
    """تحديث إحصاءات البرنامج في الخلفية."""
    update_program_applications_count_task.delay(instance.program.id)

@receiver(post_delete, sender=ProgramApplication)
def update_program_stats_on_delete(sender, instance, **kwargs):
    """تحديث إحصاءات البرنامج عند الحذف."""
    update_program_applications_count_task.delay(instance.program.id)

@receiver(post_save, sender=ProgramApplication)
def handle_application_referral(sender, instance, created, **kwargs):
    """مكافأة المحيل عند قبول الطلب."""
    from .models import ReferralReward, UserReferral

    if instance.status == 'accepted' and instance.referral_code:
        if ReferralReward.objects.filter(application=instance).exists():
            return

        try:
            referrer_info = UserReferral.objects.get(code=instance.referral_code)
            if referrer_info.user == instance.applicant:
                return

            ReferralReward.objects.create(
                referrer=referrer_info,
                application=instance,
                points_awarded=50
            )

            # تحديث النقاط بشكل ذري (Atomic Update) لمنع السباق البرمجي
            referrer_info.points = F('points') + 50
            referrer_info.total_referred = F('total_referred') + 1
            referrer_info.save(update_fields=['points', 'total_referred'])
            referrer_info.refresh_from_db(fields=['points', 'total_referred'])
            
            # إرسال الإشعار في الخلفية
            send_referral_reward_notification_task.delay(
                referrer_info.user.id, instance.applicant.id, instance.program.id
            )
        except UserReferral.DoesNotExist:
            pass

@receiver(post_save, sender=ProgramApplication)
def handle_referral_reversal(sender, instance, created, **kwargs):
    """سحب النقاط إذا تم تغيير الحالة من مقبول إلى أي حالة أخرى."""
    from .models import ReferralReward
    
    if not created and instance.status != 'accepted':
        reward = ReferralReward.objects.filter(application=instance).first()
        if reward:
            # سحب النقاط من المحيل بشكل ذري مع ضمان عدم النزول تحت الصفر
            from django.db.models import F
            from django.db.models.functions import Greatest
            referrer = reward.referrer
            UserReferral.objects.filter(pk=referrer.pk).update(
                points=Greatest(F('points') - reward.points_awarded, 0),
                total_referred=Greatest(F('total_referred') - 1, 0)
            )
            
            # حذف سجل المكافأة
            reward.delete()

@receiver(post_save, sender=ProgramApplication)
def notify_on_status_change(sender, instance, created, **kwargs):
    """إرسال إشعار للمتقدم في الخلفية عند تغيير الحالة فعلياً."""
    if created:
        return  # لا إشعار عند الإنشاء الأولي (الحالة submitted)
    # يتم الاعتماد على أن الـ Serializer يتحقق من تغيير الحالة فعلياً
    if instance.status != 'submitted':
        send_application_status_notification_task.delay(instance.id)
