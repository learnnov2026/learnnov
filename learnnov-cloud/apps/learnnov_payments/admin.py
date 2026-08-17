from django.contrib import admin
from .models import Order, StripePayment, HyperPayPayment, DiscountCode, DiscountCodeUsage, SubscriptionPlan, UserSubscription

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'course_name', 'amount', 'currency', 'status', 'gateway', 'created_at']
    list_filter = ['status', 'gateway', 'currency']
    search_fields = ['user__username', 'course_id', 'course_name']

@admin.register(StripePayment)
class StripePaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'payment_intent_id', 'stripe_status', 'created_at']

@admin.register(HyperPayPayment)
class HyperPayPaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'checkout_id', 'hyperpay_status', 'created_at']

@admin.register(DiscountCode)
class DiscountCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_percentage', 'max_uses_total', 'max_uses_per_user', 'is_active', 'expiration_date']
    list_filter = ['is_active', 'expiration_date']
    search_fields = ['code']

@admin.register(DiscountCodeUsage)
class DiscountCodeUsageAdmin(admin.ModelAdmin):
    list_display = ['discount_code', 'user', 'order', 'used_at']
    list_filter = ['used_at']
    search_fields = ['discount_code__code', 'user__username']

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'currency', 'billing_cycle', 'is_active']
    list_filter = ['billing_cycle', 'is_active']
    search_fields = ['name', 'slug']

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'current_period_start', 'current_period_end']
    list_filter = ['status', 'plan']
    search_fields = ['user__username', 'stripe_subscription_id']
