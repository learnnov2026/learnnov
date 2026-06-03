from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class ChatMessage(models.Model):
    """حفظ سجل المحادثات للمساعد الأكاديمي الذكي لكل طالب."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_chat_messages', null=True, blank=True)
    role = models.CharField(max_length=10, choices=[('user', _('طالب')), ('assistant', _('المساعد الذكي'))])
    content = models.TextField(verbose_name=_('محتوى الرسالة'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('AI Chat Message')
        verbose_name_plural = _('AI Chat Messages')
        ordering = ['created_at']

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"{username} - {self.role} - {self.content[:30]}"
