import uuid
from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class PaymentGateway(models.TextChoices):
    STRIPE = 'stripe', 'Stripe'
    HYPERPAY = 'hyperpay', 'HyperPay'


class OrderStatus(models.TextChoices):
    PENDING = 'pending', _('قيد الانتظار')
    PAID = 'paid', _('مدفوع')
    FAILED = 'failed', _('فشل الدفع')
    REFUNDED = 'refunded', _('مسترد')


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name=_('المستخدم'))
    program = models.ForeignKey(
        'academic_programs.AcademicProgram', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders', verbose_name=_('البرنامج الأكاديمي')
    )
    course_id = models.CharField(_('معرف المساق'), max_length=255, db_index=True)
    course_name = models.CharField(_('اسم المساق'), max_length=500, blank=True)
    amount = models.DecimalField(_('المبلغ'), max_digits=10, decimal_places=2)
    currency = models.CharField(_('العملة'), max_length=3, default='SAR')
    status = models.CharField(_('الحالة'), max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True)
    gateway = models.CharField(_('بوابة الدفع'), max_length=20, choices=PaymentGateway.choices)
    referral_code = models.CharField(_('كود الإحالة'), max_length=50, blank=True)
    discount_code = models.ForeignKey('DiscountCode', null=True, blank=True, on_delete=models.SET_NULL, related_name='orders', verbose_name=_('كود الخصم'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('طلب شراء')
        verbose_name_plural = _('طلبات الشراء')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} — {self.course_id} ({self.status})'


class StripePayment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='stripe_payment', verbose_name=_('الطلب'))
    payment_intent_id = models.CharField(_('معرف الدفع Intent ID'), max_length=200, unique=True)
    client_secret = models.CharField(_('الرمز السري للعميل'), max_length=500)
    stripe_status = models.CharField(_('حالة Stripe'), max_length=50, blank=True)
    raw_response = models.JSONField(_('الرد الأصلي'), default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('عملية دفع Stripe')
        verbose_name_plural = _('عمليات دفع Stripe')


class HyperPayPayment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='hyperpay_payment', verbose_name=_('الطلب'))
    checkout_id = models.CharField(_('معرف Checkout ID'), max_length=200, unique=True)
    resource_path = models.CharField(_('مسار المورد'), max_length=500, blank=True)
    hyperpay_status = models.CharField(_('حالة HyperPay'), max_length=20, blank=True)
    brand = models.CharField(_('نوع البطاقة'), max_length=20, blank=True)
    raw_response = models.JSONField(_('الرد الأصلي'), default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('عملية دفع HyperPay')
        verbose_name_plural = _('عمليات دفع HyperPay')


class DiscountCode(models.Model):
    code = models.CharField(_('الكود'), max_length=50, unique=True, db_index=True)
    discount_percentage = models.DecimalField(_('نسبة الخصم %'), max_digits=5, decimal_places=2, help_text=_("مثال: 100.00 لخصم 100%"))
    max_uses_total = models.PositiveIntegerField(_('أقصى استخدام إجمالي'), default=100)
    max_uses_per_user = models.PositiveIntegerField(_('أقصى استخدام لكل مستخدم'), default=1)
    expiration_date = models.DateTimeField(_('تاريخ الانتهاء'), null=True, blank=True)
    valid_programs = models.ManyToManyField('academic_programs.AcademicProgram', blank=True, verbose_name=_('البرامج المشمولة'))
    is_active = models.BooleanField(_('نشط'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('كود خصم')
        verbose_name_plural = _('أكواد الخصم')

    def __str__(self):
        return f"{self.code} - {self.discount_percentage}%"


class DiscountCodeUsage(models.Model):
    discount_code = models.ForeignKey(DiscountCode, on_delete=models.CASCADE, related_name='usages', verbose_name=_('كود الخصم'))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discount_usages', verbose_name=_('المستخدم'))
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('الطلب'))
    used_at = models.DateTimeField(_('تاريخ الاستخدام'), auto_now_add=True)

    class Meta:
        verbose_name = _('سجل استخدام كود خصم')
        verbose_name_plural = _('سجلات استخدام أكواد الخصم')
        unique_together = ('discount_code', 'user', 'order')

    def __str__(self):
        return f"{self.user.username} used {self.discount_code.code}"


class SubscriptionPlan(models.Model):
    """خطة اشتراك دوري (شهري / سنوي)."""
    BILLING_CYCLES = [
        ('monthly', _('شهري')),
        ('yearly', _('سنوي')),
    ]
    name = models.CharField(_('الاسم'), max_length=100)
    name_en = models.CharField(_('الاسم بالإنجليزية'), max_length=100, blank=True)
    slug = models.SlugField(_('المعرف'), max_length=50, unique=True)
    description = models.TextField(_('الوصف'), blank=True)
    stripe_price_id = models.CharField(_('معرف السعر في Stripe'), max_length=200, blank=True)
    price = models.DecimalField(_('السعر'), max_digits=10, decimal_places=2)
    currency = models.CharField(_('العملة'), max_length=5, default='SAR')
    billing_cycle = models.CharField(_('دورة الفوترة'), max_length=20, choices=BILLING_CYCLES, default='monthly')
    is_active = models.BooleanField(_('نشط'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('خطة اشتراك')
        verbose_name_plural = _('خطط الاشتراكات')

    def __str__(self):
        return f"{self.name} - {self.price} {self.currency}"


class UserSubscription(models.Model):
    """حالة اشتراك المستخدم الحالي المربوط بـ Stripe."""
    STATUS_CHOICES = [
        ('active', _('نشط')),
        ('trialing', _('تجريبي')),
        ('past_due', _('متأخر السداد')),
        ('canceled', _('ملغي')),
        ('unpaid', _('غير مدفوع')),
        ('expired', _('منتهي الصلاحية')),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, related_name='user_subscriptions')
    stripe_subscription_id = models.CharField(_('معرف الاشتراك في Stripe'), max_length=200, blank=True, null=True, unique=True, db_index=True)
    status = models.CharField(_('الحالة'), max_length=20, choices=STATUS_CHOICES, default='expired', db_index=True)
    current_period_start = models.DateTimeField(_('بداية الفترة الحالية'), null=True, blank=True)
    current_period_end = models.DateTimeField(_('نهاية الفترة الحالية'), null=True, blank=True)
    cancel_at_period_end = models.BooleanField(_('إلغاء عند نهاية الفترة'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('اشتراك مستخدم')
        verbose_name_plural = _('اشتراكات المستخدمين')

    def __str__(self):
        return f"{self.user.username} - {self.plan.name if self.plan else 'None'} ({self.status})"

