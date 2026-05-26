import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from django.conf import settings

logger = logging.getLogger(__name__)

@shared_task
def send_application_status_notification_task(application_id):
    """خلفية معالجة إرسال إشعارات حالة الطلبات."""
    from .models import ProgramApplication
    from .notifications import send_application_status_notification
    try:
        application = ProgramApplication.objects.get(id=application_id)
        send_application_status_notification(application)
    except ProgramApplication.DoesNotExist:
        logger.error(f"Task Error: Application {application_id} not found.")
    except Exception:
        logger.exception(f"Task Error sending notification for application {application_id}")

@shared_task
def send_referral_reward_notification_task(referrer_id, applicant_id, program_id):
    """خلفية معالجة إرسال إشعارات مكافآت الإحالة."""
    from .models import AcademicProgram
    from .notifications import send_referral_reward_notification
    User = get_user_model()
    try:
        referrer = User.objects.get(id=referrer_id)
        applicant = User.objects.get(id=applicant_id)
        program = AcademicProgram.objects.get(id=program_id)
        send_referral_reward_notification(referrer, applicant, program)
    except Exception:
        logger.exception("Task Error sending referral notification")

@shared_task
def update_program_applications_count_task(program_id):
    """إعادة حساب عدادات البرنامج بدقة في الخلفية لضمان سلامة البيانات."""
    from .models import AcademicProgram
    try:
        program = AcademicProgram.objects.get(id=program_id)
        program.applications_count = program.applications.count()
        program.accepted_count = program.applications.filter(status='accepted').count()
        program.save(update_fields=['applications_count', 'accepted_count'])
    except AcademicProgram.DoesNotExist:
        pass
