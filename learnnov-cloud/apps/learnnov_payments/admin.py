from django.contrib import admin
from .models import Order, StripePayment, HyperPayPayment

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'course_id', 'amount', 'status', 'gateway', 'created_at']
    list_filter = ['status', 'gateway']
    search_fields = ['user__username', 'course_id']

@admin.register(StripePayment)
class StripePaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'payment_intent_id', 'stripe_status', 'created_at']

@admin.register(HyperPayPayment)
class HyperPayPaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'checkout_id', 'hyperpay_status', 'created_at']
