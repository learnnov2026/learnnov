import uuid
from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class PaymentGateway(models.TextChoices):
    STRIPE = 'stripe', 'Stripe'
    HYPERPAY = 'hyperpay', 'HyperPay'


class OrderStatus(models.TextChoices):
    PENDING = 'pending', _('Pending')
    PAID = 'paid', _('Paid')
    FAILED = 'failed', _('Failed')
    REFUNDED = 'refunded', _('Refunded')


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    program = models.ForeignKey(
        'academic_programs.AcademicProgram', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders'
    )
    course_id = models.CharField(max_length=255, db_index=True)
    course_name = models.CharField(max_length=500, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='SAR')
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True)
    gateway = models.CharField(max_length=20, choices=PaymentGateway.choices)
    referral_code = models.CharField(max_length=50, blank=True)
    discount_code = models.ForeignKey('DiscountCode', null=True, blank=True, on_delete=models.SET_NULL, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Order')
        verbose_name_plural = _('Orders')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} — {self.course_id} ({self.status})'


class StripePayment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='stripe_payment')
    payment_intent_id = models.CharField(max_length=200, unique=True)
    client_secret = models.CharField(max_length=500)
    stripe_status = models.CharField(max_length=50, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Stripe Payment')


class HyperPayPayment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='hyperpay_payment')
    checkout_id = models.CharField(max_length=200, unique=True)
    resource_path = models.CharField(max_length=500, blank=True)
    hyperpay_status = models.CharField(max_length=20, blank=True)
    brand = models.CharField(max_length=20, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('HyperPay Payment')

class DiscountCode(models.Model):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="e.g. 100.00 for 100%")
    max_uses_total = models.PositiveIntegerField(default=100)
    max_uses_per_user = models.PositiveIntegerField(default=1)
    expiration_date = models.DateTimeField(null=True, blank=True)
    valid_programs = models.ManyToManyField('academic_programs.AcademicProgram', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.discount_percentage}%"

class DiscountCodeUsage(models.Model):
    discount_code = models.ForeignKey(DiscountCode, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discount_usages')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('discount_code', 'user', 'order')

    def __str__(self):
        return f"{self.user.username} used {self.discount_code.code}"
