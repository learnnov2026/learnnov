"""
HyperPay payment gateway integration.
Documentation: https://wordpresshyperpay.docs.oppwa.com/

Settings needed in lms.env.yml:
  LEARNNOV_HYPERPAY_ACCESS_TOKEN: OGE4...
  LEARNNOV_HYPERPAY_ENTITY_ID_VISA: 8a82...   (VISA/MasterCard)
  LEARNNOV_HYPERPAY_ENTITY_ID_MADA: 8a82...   (mada — Saudi debit)
  LEARNNOV_HYPERPAY_BASE_URL: https://eu-prod.oppwa.com   (production)
                             or https://eu-test.oppwa.com  (sandbox)
  LEARNNOV_SITE_URL: https://learnnov.com
"""
import logging

import requests
from django.conf import settings

log = logging.getLogger(__name__)

BRAND_ENTITY = {
    'VISA': 'LEARNNOV_HYPERPAY_ENTITY_ID_VISA',
    'MASTER': 'LEARNNOV_HYPERPAY_ENTITY_ID_VISA',
    'MADA': 'LEARNNOV_HYPERPAY_ENTITY_ID_MADA',
}


def _cfg(key, default=''):
    return getattr(settings, key, default)


def initiate_checkout(order, brand='VISA'):
    """
    Create a HyperPay checkout session.
    Returns (checkout_id, error_message).
    """
    base_url = _cfg('LEARNNOV_HYPERPAY_BASE_URL', 'https://eu-test.oppwa.com')
    entity_setting = BRAND_ENTITY.get(brand.upper(), 'LEARNNOV_HYPERPAY_ENTITY_ID_VISA')
    entity_id = _cfg(entity_setting)
    access_token = _cfg('LEARNNOV_HYPERPAY_ACCESS_TOKEN')
    site_url = _cfg('LEARNNOV_SITE_URL')
    if not site_url:
        log.error('LEARNNOV_SITE_URL is not set. Checkout will likely fail.')
        site_url = 'https://learnnov.com' # Fallback to production domain

    payload = {
        'entityId': entity_id,
        'amount': f'{order.amount:.2f}',
        'currency': order.currency,
        'paymentType': 'DB',
        'merchantTransactionId': str(order.id),
        'customer.email': order.user.email,
        'billing.street1': 'N/A',
        'billing.city': 'N/A',
        'billing.state': 'N/A',
        'billing.country': 'SA',
        'billing.postcode': '00000',
        'shopperResultUrl': f'{site_url}/payments/hyperpay/callback/',
        'notificationUrl': f'{site_url}/payments/hyperpay/notify/',
        'customParameters[order_id]': str(order.id),
        'customParameters[course_id]': order.course_id,
        'customParameters[merchantName]': _cfg('PLATFORM_NAME', 'LearnNov'),
    }

    headers = {'Authorization': f'Bearer {access_token}'}
    url = f'{base_url}/v1/checkouts'

    try:
        resp = requests.post(url, data=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        log.error('HyperPay initiate error: %s', exc)
        return None, str(exc)

    result_code = data.get('result', {}).get('code', '')
    if result_code.startswith('000.200'):
        return data.get('id'), None

    error_msg = data.get('result', {}).get('description', 'خطأ في بوابة الدفع')
    log.warning('HyperPay checkout failed: %s — %s', result_code, error_msg)
    return None, error_msg


def verify_payment(resource_path, brand='VISA'):
    """
    Query HyperPay about the result of a payment after callback.
    """
    base_url = _cfg('LEARNNOV_HYPERPAY_BASE_URL', 'https://eu-test.oppwa.com')
    access_token = _cfg('LEARNNOV_HYPERPAY_ACCESS_TOKEN')
    
    # اختيار الـ Entity ID المناسب بناءً على العلامة التجارية لضمان صحة الاستعلام
    entity_setting = BRAND_ENTITY.get(brand.upper(), 'LEARNNOV_HYPERPAY_ENTITY_ID_VISA')
    entity_id = _cfg(entity_setting)

    # التحقق من المسار لمنع ثغرات SSRF وتسريب الـ Token
    if not resource_path.startswith('/v1/checkouts/') or '@' in resource_path:
        log.error('Suspicious resource_path detected: %s', resource_path)
        return False, 'security_error', {}

    url = f'{base_url}{resource_path}?entityId={entity_id}'
    headers = {'Authorization': f'Bearer {access_token}'}

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        log.error('HyperPay verify error: %s', exc)
        return False, 'error', {}

    result_code = data.get('result', {}).get('code', '')

    # Successful transaction codes according to HyperPay docs:
    # 000.000.000 = Transaction succeeded
    # 000.100.110 = Request successfully processed (debit)
    # 000.100.111 = Request successfully processed (credit)
    # 000.100.112 = Request successfully processed (preauthorization)
    # 000.000.100 = Successful capture (after preauth)
    CONFIRMED_SUCCESS_CODES = frozenset([
        '000.000.000', '000.100.110', '000.100.111', '000.100.112', '000.000.100'
    ])
    
    # Refund result codes (e.g., 000.100.113, 000.100.115 for some adapters)
    REFUND_SUCCESS_CODES = frozenset([
        '000.100.113', '000.100.115', '000.100.116'
    ])

    succeeded = result_code in CONFIRMED_SUCCESS_CODES
    is_refund = result_code in REFUND_SUCCESS_CODES

    if not succeeded and not is_refund:
        log.info('HyperPay payment not confirmed: code=%s, order=%s',
                 result_code, data.get('merchantTransactionId', 'unknown'))

    return succeeded, is_refund, result_code, data
