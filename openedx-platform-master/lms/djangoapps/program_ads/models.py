from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

User = get_user_model()


class AdPlacement(models.Model):
    """مكان عرض الإعلان في المنصة."""

    PLACEMENT_TYPES = [
        ('banner_top', _('بانر رأس الصفحة')),
        ('banner_bottom', _('بانر أسفل الصفحة')),
        ('sidebar', _('الشريط الجانبي')),
        ('program_card', _('بطاقة البرنامج')),
        ('search_results', _('نتائج البحث')),
        ('dashboard', _('لوحة المتعلم')),
        ('course_page', _('صفحة المقرر')),
        ('popup', _('نافذة منبثقة')),
    ]

    name = models.CharField(_('الاسم'), max_length=100)
    slug = models.SlugField(_('المعرف'), max_length=100, unique=True)
    placement_type = models.CharField(_('نوع المكان'), max_length=30, choices=PLACEMENT_TYPES)
    description = models.TextField(_('الوصف'), blank=True)
    max_width = models.PositiveSmallIntegerField(_('أقصى عرض (px)'), default=728)
    max_height = models.PositiveSmallIntegerField(_('أقصى ارتفاع (px)'), default=90)
    is_active = models.BooleanField(_('نشط'), default=True)
    base_price_per_day = models.DecimalField(
        _('السعر الأساسي/يوم'), max_digits=8, decimal_places=2, default=100
    )

    class Meta:
        verbose_name = _('مكان الإعلان')
        verbose_name_plural = _('أماكن الإعلانات')
        ordering = ['placement_type', 'name']

    def __str__(self):
        return f"{self.get_placement_type_display()} — {self.name}"


class Advertisement(models.Model):
    """إعلان برنامج أكاديمي أو خدمة تعليمية."""

    AD_TYPES = [
        ('image', _('صورة')),
        ('text', _('نص')),
        ('video', _('فيديو')),
        ('html', _('HTML مخصص')),
    ]

    STATUS_CHOICES = [
        ('draft', _('مسودة')),
        ('pending', _('قيد المراجعة')),
        ('approved', _('موافق عليه')),
        ('active', _('نشط')),
        ('paused', _('موقوف مؤقتاً')),
        ('expired', _('منتهي')),
        ('rejected', _('مرفوض')),
    ]

    TARGET_GENDERS = [
        ('all', _('الكل')),
        ('male', _('ذكر')),
        ('female', _('أنثى')),
    ]

    # الإعلان الأساسي
    title = models.CharField(_('عنوان الإعلان'), max_length=200)
    advertiser_name = models.CharField(_('اسم المعلن'), max_length=200)
    advertiser_email = models.EmailField(_('بريد المعلن'))
    ad_type = models.CharField(_('نوع الإعلان'), max_length=20, choices=AD_TYPES, default='image')
    placement = models.ForeignKey(
        AdPlacement, on_delete=models.CASCADE,
        related_name='advertisements', verbose_name=_('مكان العرض')
    )

    # المحتوى
    image = models.ImageField(_('الصورة'), upload_to='ads/images/', blank=True, null=True)
    video_url = models.URLField(_('رابط الفيديو'), blank=True)
    html_content = models.TextField(_('محتوى HTML'), blank=True)
    headline = models.CharField(_('العنوان الرئيسي'), max_length=100, blank=True)
    body_text = models.TextField(_('النص'), blank=True)
    call_to_action = models.CharField(_('نص الزر'), max_length=50, default='اعرف أكثر')
    destination_url = models.URLField(_('الرابط المستهدف'))
    alt_text = models.CharField(_('النص البديل'), max_length=200, blank=True)

    # الاستهداف
    target_gender = models.CharField(
        _('الجنس المستهدف'), max_length=10, choices=TARGET_GENDERS, default='all'
    )
    target_countries = models.JSONField(
        _('الدول المستهدفة'), default=list, blank=True,
        help_text='قائمة رموز الدول: ["SA", "AE", "EG"]'
    )
    target_age_min = models.PositiveSmallIntegerField(_('الحد الأدنى للعمر'), default=0)
    target_age_max = models.PositiveSmallIntegerField(_('الحد الأقصى للعمر'), default=0, help_text='0 = بلا حد')
    target_interests = models.JSONField(
        _('الاهتمامات المستهدفة'), default=list, blank=True,
        help_text='مجالات دراسية slug'
    )
    target_degree_levels = models.JSONField(
        _('المستويات الأكاديمية'), default=list, blank=True
    )

    # الجدولة والميزانية
    status = models.CharField(_('الحالة'), max_length=20, choices=STATUS_CHOICES, default='draft')
    start_date = models.DateTimeField(_('تاريخ البدء'))
    end_date = models.DateTimeField(_('تاريخ الانتهاء'))
    daily_budget = models.DecimalField(_('الميزانية اليومية'), max_digits=10, decimal_places=2, default=0)
    total_budget = models.DecimalField(_('الميزانية الإجمالية'), max_digits=10, decimal_places=2, default=0)
    cost_per_click = models.DecimalField(_('التكلفة لكل نقرة'), max_digits=6, decimal_places=2, default=0)
    cost_per_impression = models.DecimalField(_('التكلفة لكل ظهور'), max_digits=6, decimal_places=3, default=0)

    # إحصاءات
    total_impressions = models.PositiveIntegerField(_('إجمالي الظهور'), default=0)
    total_clicks = models.PositiveIntegerField(_('إجمالي النقرات'), default=0)
    total_spent = models.DecimalField(_('إجمالي الإنفاق'), max_digits=10, decimal_places=2, default=0)

    # إدارة
    priority = models.PositiveSmallIntegerField(_('الأولوية'), default=5, help_text='1 أعلى، 10 أدنى')
    is_premium = models.BooleanField(_('إعلان مميز'), default=False)
    reviewer_notes = models.TextField(_('ملاحظات المراجع'), blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='created_ads', verbose_name=_('أنشأه')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('إعلان')
        verbose_name_plural = _('الإعلانات')
        ordering = ['priority', '-is_premium', '-created_at']
        indexes = [
            models.Index(fields=['status', 'start_date', 'end_date']),
            models.Index(fields=['placement', 'status']),
        ]

    def __str__(self):
        return f"{self.title} ({self.advertiser_name})"

    @property
    def is_currently_active(self):
        now = timezone.now()
        return (
            self.status == 'active'
            and self.start_date <= now <= self.end_date
            and (self.total_budget == 0 or self.total_spent < self.total_budget)
        )

    @property
    def ctr(self):
        if self.total_impressions == 0:
            return 0.0
        return round(self.total_clicks / self.total_impressions * 100, 2)


class AdImpression(models.Model):
    """سجل ظهور أو نقرة على إعلان."""

    EVENT_TYPES = [
        ('impression', _('ظهور')),
        ('click', _('نقرة')),
    ]

    advertisement = models.ForeignKey(
        Advertisement, on_delete=models.CASCADE,
        related_name='impressions', verbose_name=_('الإعلان')
    )
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='ad_interactions', verbose_name=_('المستخدم')
    )
    event_type = models.CharField(_('نوع الحدث'), max_length=20, choices=EVENT_TYPES)
    ip_address = models.GenericIPAddressField(_('عنوان IP'), null=True, blank=True)
    user_agent = models.CharField(_('المتصفح'), max_length=500, blank=True)
    referrer = models.URLField(_('المرجع'), blank=True)
    session_key = models.CharField(_('الجلسة'), max_length=40, blank=True)
    country_code = models.CharField(_('الدولة'), max_length=2, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('تفاعل مع إعلان')
        verbose_name_plural = _('تفاعلات الإعلانات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['advertisement', 'event_type', 'created_at']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.get_event_type_display()} — {self.advertisement.title}"
