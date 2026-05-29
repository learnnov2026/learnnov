from django.urls import path
from . import views

app_name = 'learnnov_payments'

urlpatterns = [
    path('stripe/create-intent/', views.CreateStripePaymentView.as_view(), name='stripe-create-intent'),
    path('stripe/webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('stripe/verify/', views.VerifyPaymentView.as_view(), name='stripe-verify'),
    path('discount/apply/', views.ApplyDiscountCodeView.as_view(), name='discount-apply'),
    path('orders/', views.StudentOrderListView.as_view(), name='student-orders'),
]
