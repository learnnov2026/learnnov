from django.urls import path
from . import views

app_name = 'learnnov_payments'

urlpatterns = [
    path('stripe/create-intent/', views.CreateStripePaymentView.as_view(), name='stripe-create-intent'),
    path('stripe/webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('stripe/verify/', views.VerifyPaymentView.as_view(), name='stripe-verify'),
    path('discount/apply/', views.ApplyDiscountCodeView.as_view(), name='discount-apply'),
    path('orders/', views.StudentOrderListView.as_view(), name='student-orders'),
    path('subscriptions/plans/', views.SubscriptionPlanListView.as_view(), name='subscription-plans'),
    path('subscriptions/my/', views.UserSubscriptionDetailView.as_view(), name='user-subscription-detail'),
    path('subscriptions/checkout/', views.CreateSubscriptionCheckoutSessionView.as_view(), name='subscription-checkout'),
    path('subscriptions/simulate/', views.SimulateSubscriptionCheckoutView.as_view(), name='subscription-simulate'),
    path('subscriptions/cancel/', views.CancelSubscriptionView.as_view(), name='subscription-cancel'),
]
