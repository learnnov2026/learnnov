from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription, Order

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['id', 'user', 'status', 'created_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'name_en', 'slug', 'description', 'price', 'currency', 'billing_cycle', 'is_active', 'stripe_price_id']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_name_en = serializers.CharField(source='plan.name_en', read_only=True)
    price = serializers.DecimalField(source='plan.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = UserSubscription
        fields = ['id', 'plan', 'plan_name', 'plan_name_en', 'price', 'status', 'current_period_start', 'current_period_end', 'cancel_at_period_end']
