from django.db import models
from django.conf import settings

class EnterpriseCompany(models.Model):
    name = models.CharField(max_length=255, verbose_name="اسم الشركة")
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='managed_companies')
    total_licenses = models.IntegerField(default=0, verbose_name="عدد التراخيص المتاحة")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "الشركة المتعاقدة"
        verbose_name_plural = "الشركات المتعاقدة"

class EnterpriseLearner(models.Model):
    company = models.ForeignKey(EnterpriseCompany, on_delete=models.CASCADE, related_name='learners')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.company.name}"

    class Meta:
        verbose_name = "المتدرب التابع لشركة"
        verbose_name_plural = "المتدربون التابعون للشركات"
        # حماية من تكرار ربط نفس الطالب بالشركة لضمان سلامة التراخيص المستهلكة
        unique_together = [['company', 'user']]
