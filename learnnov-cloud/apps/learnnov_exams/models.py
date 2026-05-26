from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class MockExam(models.Model):
    """نموذج اختبار تجريبي."""
    course_id = models.CharField(max_length=255, db_index=True)
    title = models.CharField(_('العنوان'), max_length=255)
    description = models.TextField(_('الوصف'), blank=True)
    time_limit_minutes = models.PositiveIntegerField(_('الوقت المحدد (دقائق)'), default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('اختبار تجريبي')
        verbose_name_plural = _('الاختبارات التجريبية')

    def __str__(self):
        return self.title


class Question(models.Model):
    """سؤال في الاختبار."""
    QUESTION_TYPES = [
        ('mcq', _('اختيار من متعدد')),
        ('tf', _('صح أو خطأ')),
    ]
    exam = models.ForeignKey(MockExam, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField(_('نص السؤال'))
    points = models.PositiveIntegerField(_('النقاط'), default=1)
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='mcq')

    def __str__(self):
        return f"{self.exam.title} - {self.text[:50]}"


class Choice(models.Model):
    """خيارات السؤال."""
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(_('نص الخيار'), max_length=255)
    is_correct = models.BooleanField(_('إجابة صحيحة'), default=False)

    def __str__(self):
        return self.text


class ExamAttempt(models.Model):
    """محاولة الطالب في الاختبار."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(MockExam, on_delete=models.CASCADE)
    score = models.FloatField(default=0)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.exam.title}"

    @property
    def is_overdue(self):
        """التحقق مما إذا كان الطالب قد تجاوز الوقت المحدد مع فترة سماح 60 ثانية."""
        from django.utils import timezone
        grace_period = 60 # ثانية
        limit = (self.exam.time_limit_minutes * 60) + grace_period
        
        if self.is_completed:
            return (self.end_time - self.start_time).total_seconds() > limit
        
        elapsed = (timezone.now() - self.start_time).total_seconds()
        return elapsed > limit


class StudentAnswer(models.Model):
    """إجابة الطالب على سؤال محدد في محاولة."""
    attempt = models.ForeignKey(ExamAttempt, related_name='answers', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE)
    is_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = [['attempt', 'question']]
        verbose_name = _('إجابة طالب')
        verbose_name_plural = _('إجابات الطلاب')


class ExamActionLog(models.Model):
    """سجل حركات الطالب أثناء الاختبار للتدقيق ومنع الغش."""
    attempt = models.ForeignKey(ExamAttempt, related_name='action_logs', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=50, default='submit_answer')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _('سجل حركة الاختبار')
        verbose_name_plural = _('سجلات حركات الاختبارات')
        ordering = ['timestamp']
