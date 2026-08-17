from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class ChatMessage(models.Model):
    """حفظ سجل المحادثات للمساعد الأكاديمي الذكي لكل طالب."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_chat_messages', null=True, blank=True, verbose_name=_('المستخدم'))
    role = models.CharField(_('الدور'), max_length=10, choices=[('user', _('طالب')), ('assistant', _('المساعد الذكي'))])
    content = models.TextField(verbose_name=_('محتوى الرسالة'))
    created_at = models.DateTimeField(_('تاريخ الرسالة'), auto_now_add=True)

    class Meta:
        verbose_name = _('رسالة المساعد الذكي')
        verbose_name_plural = _('رسائل المساعد الذكي')
        ordering = ['created_at']

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"{username} - {self.role} - {self.content[:30]}"
