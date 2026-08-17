from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from .models import Order, OrderStatusHistory

@receiver(pre_save, sender=Order)
def track_order_status_change(sender, instance, **kwargs):
    """تسجيل تغييرات حالة الطلب في سجل التاريخ لضمان القابلية للتدقيق."""
    if instance.pk:
        try:
            # جلب الحالة القديمة من قاعدة البيانات
            old_order = Order.objects.get(pk=instance.pk)
            if old_order.status != instance.status:
                # محاولة جلب المستخدم الحالي من الـ Crum middleware إذا كان متاحاً في البيئة
                try:
                    from crum import get_current_user
                    user = get_current_user()
                except ImportError:
                    user = None

                OrderStatusHistory.objects.create(
                    order=instance,
                    old_status=old_order.status,
                    new_status=instance.status,
                    changed_by=user if user and user.is_authenticated else None,
                    notes=_("تحديث تلقائي أو عبر بوابة الدفع")
                )
        except Order.DoesNotExist:
            pass
