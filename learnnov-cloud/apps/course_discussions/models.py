from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from apps.academic_programs.models import AcademicProgram

User = get_user_model()

class DiscussionThread(models.Model):
    """
    سؤال أو موضوع نقاش داخل مقرر معين.
    """
    program = models.ForeignKey(AcademicProgram, on_delete=models.CASCADE, related_name='discussion_threads', verbose_name=_('المقرر'))
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='threads', verbose_name=_('صاحب السؤال'))
    title = models.CharField(_('العنوان'), max_length=255)
    body = models.TextField(_('المحتوى'))
    is_pinned = models.BooleanField(_('مثبت'), default=False)
    is_resolved = models.BooleanField(_('محلول'), default=False)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('تاريخ الإنشاء'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('آخر تحديث'))

    class Meta:
        verbose_name = _('موضوع نقاش')
        verbose_name_plural = _('مواضيع النقاش')
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"{self.title} - {self.program.title}"


class DiscussionPost(models.Model):
    """
    رد على موضوع نقاش (Thread).
    """
    thread = models.ForeignKey(DiscussionThread, on_delete=models.CASCADE, related_name='posts', verbose_name=_('الموضوع'))
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='thread_posts', verbose_name=_('الكاتب'))
    body = models.TextField(_('الرد'))
    is_instructor_reply = models.BooleanField(_('رد مدرب'), default=False)
    is_accepted_answer = models.BooleanField(_('إجابة معتمدة'), default=False)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('تاريخ الإنشاء'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('آخر تحديث'))

    class Meta:
        verbose_name = _('رد')
        verbose_name_plural = _('ردود')
        ordering = ['created_at']

    def __str__(self):
        return f"رد بواسطة {self.author.username} على {self.thread.title}"
