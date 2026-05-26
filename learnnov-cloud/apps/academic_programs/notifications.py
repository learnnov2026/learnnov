import logging
from django.conf import settings
from django.core.mail import send_mail
from django.utils.translation import gettext as _

logger = logging.getLogger(__name__)

def send_application_status_notification(application):
    """
    إرسال إشعار للمتقدم عند تغيير حالة طلبه مع دعم HTML.
    """
    from django.core.mail import EmailMultiAlternatives

    user = application.applicant
    program_title = application.program.title
    status = application.status
    
    subjects = {
        'submitted': _('تم استلام طلبك لبرنامج {program}').format(program=program_title),
        'under_review': _('طلبك لبرنامج {program} قيد المراجعة').format(program=program_title),
        'accepted': _('تهانينا! تم قبولك في برنامج {program}').format(program=program_title),
        'rejected': _('تحديث بخصوص طلبك لبرنامج {program}').format(program=program_title),
    }
    
    subject = subjects.get(status, _('تحديث حالة الطلب | LearnNov'))
    
    # محتوى البريد (Plain Text)
    text_content = _(
        "عزيزي {name},\n\n"
        "نود إبلاغك بأن حالة طلبك لبرنامج '{program}' قد تغيرت إلى: {status}.\n"
        "يمكنك متابعة التفاصيل عبر حسابك في منصة LearnNov.\n\n"
        "مع تحيات فريق LearnNov"
    ).format(
        name=application.full_name,
        program=program_title,
        status=application.get_status_display()
    )

    # محتوى البريد (HTML)
    html_content = f"""
    <div dir="rtl" style="font-family: 'Cairo', sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0f766e;">LearnNov</h2>
        <p>عزيزي <strong>{application.full_name}</strong>،</p>
        <p>نود إبلاغك بتحديث جديد بخصوص طلبك لبرنامج: <span style="color: #0f766e;">{program_title}</span></p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            الحالة الجديدة: <strong>{application.get_status_display()}</strong>
        </div>
        <p>يمكنك تسجيل الدخول للمنصة لمتابعة الإجراءات القادمة.</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #64748b;">هذا بريد تلقائي، يرجى عدم الرد عليه.</p>
    </div>
    """

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@learnnov.com')
        msg = EmailMultiAlternatives(subject, text_content, from_email, [application.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)
        logger.info(f"HTML Email sent for application {application.id} status {status}")
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")

    # إرسال SMS (عند القبول)
    if status == 'accepted':
        _send_sms_placeholder(
            application.phone,
            _("تهانينا {name}! تم قبولك في {program}. راجع بريدك للتفاصيل.").format(
                name=application.full_name, program=program_title
            )
        )

def _send_sms_placeholder(phone, message):
    """
    الربط الفعلي مع بوابة SMS (Unifonic كمثال).
    """
    import requests
    
    sender_id = getattr(settings, 'LEARNNOV_SMS_SENDER_ID', 'LearnNov')
    api_key = getattr(settings, 'LEARNNOV_SMS_API_KEY', '')
    base_url = getattr(settings, 'LEARNNOV_SMS_BASE_URL', 'https://api.unifonic.com/rest/')
    
    if not api_key:
        logger.warning("SMS API Key missing. Skipping SMS.")
        return

    clean_phone = ''.join(filter(str.isdigit, str(phone)))
    
    payload = {
        'AppSid': api_key,
        'Recipient': clean_phone,
        'Body': message,
        'SenderID': sender_id
    }
    
    try:
        response = requests.post(f"{base_url}Messages/Send", data=payload, timeout=10)
        result = response.json()
        if result.get('success'):
            logger.info(f"SMS sent successfully to {clean_phone}")
        else:
            logger.error(f"SMS Gateway Error: {result}")
    except Exception as e:
        logger.error(f"Failed to connect to SMS Gateway: {e}")

def send_referral_reward_notification(referrer, applicant, program):
    """
    إرسال إشعار للمحيل عند حصوله على مكافأة.
    """
    try:
        subject = _('تهانينا! حصلت على نقاط مكافأة في LearnNov')
        message = _(
            "مرحباً {referrer_name},\n\n"
            "خبر رائع! لقد تم قبول '{applicant_name}' في برنامج '{program}' باستخدام كود الإحالة الخاص بك.\n"
            "لقد حصلت الآن على 50 نقطة إضافية في رصيدك.\n\n"
            "استمر في مشاركة العلم والحصول على المكافآت!\n"
            "مع تحيات فريق LearnNov"
        ).format(
            referrer_name=referrer.get_full_name() or referrer.username,
            applicant_name=applicant.get_full_name() or applicant.username,
            program=program.title
        )
        
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@learnnov.com')
        send_mail(
            subject,
            message,
            from_email,
            [referrer.email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send referral notification: {e}")
