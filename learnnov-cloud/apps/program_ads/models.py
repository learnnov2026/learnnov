from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

User = get_user_model()


class AdPlacement(models.Model):
    PLACEMENT_TYPES = [
        ('banner_top', _('بانر رأس الصفحة')),
        ('sidebar', _('الشريط الجانبي')),
        ('program_card', _('بطاقة البرنامج')),
        ('search_results', _('نتائج البحث')),
        ('dashboard', _('لوحة المتعلم')),
    ]
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    placement_type = models.CharField(max_length=30, choices=PLACEMENT_TYPES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    base_price_per_day = models.DecimalField(max_digits=8, decimal_places=2, default=100)

    class Meta:
        verbose_name = _('مكان الإعلان')
        verbose_name_plural = _('أماكن الإعلانات')

    def __str__(self):
        return f"{self.get_placement_type_display()} — {self.name}"


class Advertisement(models.Model):
    AD_TYPES = [('image', _('صورة')), ('text', _('نص')), ('video', _('فيديو'))]
    STATUS_CHOICES = [
        ('draft', _('مسودة')), ('pending', _('قيد المراجعة')),
        ('approved', _('موافق عليه')), ('active', _('نشط')),
        ('paused', _('موقوف')), ('expired', _('منتهي')), ('rejected', _('مرفوض')),
    ]

    title = models.CharField(max_length=200)
    advertiser_name = models.CharField(max_length=200)
    advertiser_email = models.EmailField()
    ad_type = models.CharField(max_length=20, choices=AD_TYPES, default='image')
    placement = models.ForeignKey(AdPlacement, on_delete=models.CASCADE, related_name='advertisements')
    image = models.ImageField(upload_to='ads/images/', blank=True, null=True)
    headline = models.CharField(max_length=100, blank=True)
    body_text = models.TextField(blank=True)
    call_to_action = models.CharField(max_length=50, default='اعرف أكثر')
    destination_url = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    total_impressions = models.PositiveIntegerField(default=0)
    total_clicks = models.PositiveIntegerField(default=0)
    priority = models.PositiveSmallIntegerField(default=5)
    is_premium = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_ads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('إعلان')
        verbose_name_plural = _('الإعلانات')
        ordering = ['priority', '-is_premium', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.advertiser_name})"

    @property
    def is_currently_active(self):
        now = timezone.now()
        return self.status == 'active' and self.start_date <= now <= self.end_date

    @property
    def ctr(self):
        if self.total_impressions == 0:
            return 0.0
        return round(self.total_clicks / self.total_impressions * 100, 2)
