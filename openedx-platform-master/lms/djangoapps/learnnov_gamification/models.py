from django.db import models
from django.conf import settings

class UserGamificationProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gamification_profile')
    total_points = models.IntegerField(default=0, verbose_name="إجمالي النقاط")
    current_streak = models.IntegerField(default=0, verbose_name="أيام متتالية حالية")
    longest_streak = models.IntegerField(default=0, verbose_name="أطول سلسلة أيام")
    last_activity_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - Points: {self.total_points}"

    def update_streak(self):
        """تحديث سلسلة النشاط اليومي بشكل آمن ومنح نقاط النشاط."""
        from django.utils import timezone
        from django.db.models import F
        
        today = timezone.now().date()
        
        if self.last_activity_date is None:
            # النشاط الأول للمستخدم على الإطلاق
            self.current_streak = 1
            self.longest_streak = 1
            self.total_points = F('total_points') + 10
        else:
            delta = today - self.last_activity_date
            if delta.days == 1:
                # نشاط في يوم متتالي مباشرة
                self.current_streak = F('current_streak') + 1
                self.save(update_fields=['current_streak'])
                self.refresh_from_db(fields=['current_streak'])
                
                # تحديث أطول سلسلة إذا لزم الأمر
                if self.current_streak > self.longest_streak:
                    self.longest_streak = self.current_streak
                    
                # منح نقاط تحفيزية إضافية تعتمد على طول السلسلة
                self.total_points = F('total_points') + (10 + (2 * self.current_streak))
            elif delta.days > 1:
                # انقطاع السلسلة، إعادة التعيين لـ 1
                self.current_streak = 1
                self.total_points = F('total_points') + 10
            # في حال كان delta.days == 0 (نفس اليوم)، لا يتم إجراء أي تغيير لمنع تكرار الاحتساب

        self.last_activity_date = today
        self.save(update_fields=['total_points', 'current_streak', 'longest_streak', 'last_activity_date'])
        self.refresh_from_db(fields=['total_points', 'current_streak', 'longest_streak'])

    class Meta:
        verbose_name = "ملف نقاط وتحفيز الطالب"
        verbose_name_plural = "ملفات النقاط والتحفيز"


class ExamPointsAwarded(models.Model):
    """سجل لحفظ نقاط الامتحانات الممنوحة ومنع تكرار المكافأة للمحاولة الواحدة."""
    attempt = models.OneToOneField(
        'learnnov_exams.ExamAttempt', 
        on_delete=models.CASCADE, 
        related_name='gamification_points',
        verbose_name="محاولة الاختبار"
    )
    points_awarded = models.PositiveIntegerField(verbose_name="النقاط الممنوحة")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "نقاط محاولة الامتحان الممنوحة"
        verbose_name_plural = "سجلات نقاط الامتحانات الممنوحة"
