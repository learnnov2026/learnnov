from django.contrib import admin

from .models import HyperPayPayment, Order, StripePayment


class StripePaymentInline(admin.StackedInline):
    model = StripePayment
    extra = 0
    readonly_fields = ('payment_intent_id', 'stripe_status', 'created_at', 'updated_at')
    can_delete = False


class HyperPayPaymentInline(admin.StackedInline):
    model = HyperPayPayment
    extra = 0
    readonly_fields = ('checkout_id', 'hyperpay_status', 'brand', 'created_at', 'updated_at')
    can_delete = False

class OrderStatusHistoryInline(admin.TabularInline):
    from .models import OrderStatusHistory
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ('old_status', 'new_status', 'changed_by', 'timestamp', 'notes')
    can_delete = False
    def has_add_permission(self, request, obj=None): return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'course_id', 'amount', 'currency', 'gateway', 'status', 'created_at')
    list_filter = ('status', 'gateway', 'currency')
    search_fields = ('user__username', 'user__email', 'course_id', 'course_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [StripePaymentInline, HyperPayPaymentInline, OrderStatusHistoryInline]
    date_hierarchy = 'created_at'
