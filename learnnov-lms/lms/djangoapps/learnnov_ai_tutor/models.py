from django.db import models
from django.conf import settings



class ChatMessage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course_id = models.CharField(max_length=255)
    message = models.TextField()
    is_bot = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "سجل محادثة المساعد الذكي"
        verbose_name_plural = "سجلات محادثات المساعد الذكي"

    def __str__(self):
        return f"{self.user.username} - {self.course_id} - {'Bot' if self.is_bot else 'User'}"
