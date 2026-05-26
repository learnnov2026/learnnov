from django.urls import path

from . import views

app_name = 'learnnov_payments'

urlpatterns = [
    # Checkout entry point
    path('checkout/', views.checkout, name='checkout'),

    # Stripe
    path('stripe/create-intent/', views.stripe_create_intent, name='stripe_create_intent'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe_webhook'),
    path('stripe/success/', views.stripe_success, name='stripe_success'),

    # HyperPay
    path('hyperpay/initiate/', views.hyperpay_initiate, name='hyperpay_initiate'),
    path('hyperpay/callback/', views.hyperpay_callback, name='hyperpay_callback'),
    path('hyperpay/notify/', views.hyperpay_notify, name='hyperpay_notify'),
]
