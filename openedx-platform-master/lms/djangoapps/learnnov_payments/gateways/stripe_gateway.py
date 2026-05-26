"""
Stripe payment gateway integration.
Requires: pip install stripe
Settings needed in lms.env.yml:
  LEARNNOV_STRIPE_SECRET_KEY: sk_live_...
  LEARNNOV_STRIPE_PUBLISHABLE_KEY: pk_live_...
  LEARNNOV_STRIPE_WEBHOOK_SECRET: whsec_...
"""
import logging

import stripe
from django.conf import settings

log = logging.getLogger(__name__)


def _get_stripe():
    stripe.api_key = getattr(settings, 'LEARNNOV_STRIPE_SECRET_KEY', '')
    return stripe


def create_payment_intent(order):
    """Create a Stripe PaymentIntent and return (intent_id, client_secret)."""
    s = _get_stripe()
    intent = s.PaymentIntent.create(
        amount=int(round(order.amount * 100)),  # Stripe uses smallest currency unit
        currency=order.currency.lower(),
        metadata={
            'order_id': str(order.id),
            'course_id': order.course_id,
            'user_id': str(order.user_id),
        },
        description=f'LearnNov — {order.course_name or order.course_id}',
        receipt_email=order.user.email,
    )
    return intent['id'], intent['client_secret']


def handle_webhook(payload, sig_header):
    """Verify and parse a Stripe webhook event. Returns (event_type, order_id, succeeded)."""
    s = _get_stripe()
    secret = getattr(settings, 'LEARNNOV_STRIPE_WEBHOOK_SECRET', '')
    try:
        event = s.Webhook.construct_event(payload, sig_header, secret)
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        log.warning('Stripe webhook verification failed: %s', exc)
        return None, None, False

    event_type = event['type']
    order_id = None
    status = 'ignored'

    if event_type in ('payment_intent.succeeded', 'payment_intent.payment_failed'):
        obj = event['data']['object']
        order_id = obj.get('metadata', {}).get('order_id')
        status = 'paid' if event_type == 'payment_intent.succeeded' else 'failed'
    
    elif event_type == 'charge.refunded':
        obj = event['data']['object']
        order_id = obj.get('metadata', {}).get('order_id')
        status = 'refunded'

    return event_type, order_id, status
