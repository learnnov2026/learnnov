import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class PaymentGateway(models.TextChoices):
    STRIPE   = 'stripe',   'Stripe'
    HYPERPAY = 'hyperpay', 'HyperPay'


class OrderStatus(models.TextChoices):
    PENDING  = 'pending',  _('Pending')
    PAID     = 'paid',     _('Paid')
    FAILED   = 'failed',   _('Failed')
    REFUNDED = 'refunded', _('Refunded')


class Order(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    
    # ربط اختياري بالبرنامج الأكاديمي المخصص
    program     = models.ForeignKey(
        'academic_programs.AcademicProgram', on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='orders'
    )
    
    course_id   = models.CharField(max_length=255, verbose_name=_('Course ID'), db_index=True)
    course_name = models.CharField(max_length=500, verbose_name=_('Course Name'), blank=True)
    amount      = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Amount'))
    currency    = models.CharField(max_length=3, default='SAR', verbose_name=_('Currency'))
    status      = models.CharField(
        max_length=20, choices=OrderStatus.choices, 
        default=OrderStatus.PENDING, verbose_name=_('Status'),
        db_index=True
    )
    gateway     = models.CharField(max_length=20, choices=PaymentGateway.choices, verbose_name=_('Payment Gateway'))
    referral_code = models.CharField(max_length=50, blank=True, verbose_name=_('Referral Code'))
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Order')
        verbose_name_plural = _('Orders')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['course_id', 'status']),
        ]

    def __str__(self):
        return f'{self.user.username} — {self.course_id} ({self.status})'


class OrderStatusHistory(models.Model):
    """سجل تدقيق لتغييرات حالة الطلب (Audit Trail)."""
    order      = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, choices=OrderStatus.choices)
    new_status = models.CharField(max_length=20, choices=OrderStatus.choices)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes      = models.TextField(blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Order Status History')
        verbose_name_plural = _('Order Status Histories')
        ordering = ['-timestamp']


class StripePayment(models.Model):
    order             = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='stripe_payment')
    payment_intent_id = models.CharField(max_length=200, unique=True)
    client_secret     = models.CharField(max_length=500)
    stripe_status     = models.CharField(max_length=50, blank=True)
    raw_response      = models.JSONField(default=dict, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Stripe Payment')
        verbose_name_plural = _('Stripe Payments')


class HyperPayPayment(models.Model):
    order          = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='hyperpay_payment')
    checkout_id    = models.CharField(max_length=200, unique=True)
    resource_path  = models.CharField(max_length=500, blank=True)
    hyperpay_status = models.CharField(max_length=20, blank=True)
    brand          = models.CharField(max_length=20, blank=True, verbose_name=_('Card Brand'))
    raw_response   = models.JSONField(default=dict, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('HyperPay Payment')
        verbose_name_plural = _('HyperPay Payments')
