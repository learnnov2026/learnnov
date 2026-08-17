import logging
import threading
import sys
from django.contrib.auth import get_user_model
from celery import shared_task

logger = logging.getLogger(__name__)

class DelayableTask:
    """
    فئة لمحاكاة سلوك Celery Task (.delay) باستخدام Threads خلفية خفيفة.
    يستخدم كـ fallback في حال غياب خادم Redis/Celery.
    """
    def __init__(self, func):
        self.func = func

    def delay(self, *args, **kwargs):
        if 'test' in sys.argv:
            self._run_safe(*args, **kwargs)
            return None
        thread = threading.Thread(target=self._run_safe, args=args, kwargs=kwargs)
        thread.daemon = True
        thread.start()
        return thread

    def _run_safe(self, *args, **kwargs):
        try:
            self.func(*args, **kwargs)
        except Exception as e:
            logger.exception(f"Error in background task {self.func.__name__}: {e}")

def hybrid_task(func):
    # 1. Create a real Celery task
    celery_task = shared_task(func)
    
    # 2. Create a fallback task
    fallback_task = DelayableTask(func)
    
    class HybridTaskWrapper:
        def __init__(self):
            self.celery_task = celery_task
            self.fallback_task = fallback_task
            
        def delay(self, *args, **kwargs):
            if 'test' in sys.argv:
                return self.fallback_task.delay(*args, **kwargs)
            
            try:
                # Try sending task to Celery Broker
                return self.celery_task.delay(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Celery broker not available, falling back to background Thread: {e}")
                return self.fallback_task.delay(*args, **kwargs)
                
        def __call__(self, *args, **kwargs):
            return func(*args, **kwargs)
            
    return HybridTaskWrapper()

@hybrid_task
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

@hybrid_task
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

@hybrid_task
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
