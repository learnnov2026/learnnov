import logging

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.translation import get_language
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from common.djangoapps.edxmako.shortcuts import render_to_response
from opaque_keys.edx.keys import CourseKey

from common.djangoapps.course_modes.models import CourseMode
from common.djangoapps.student.models import CourseEnrollment
from openedx.core.djangoapps.content.course_overviews.models import CourseOverview

from .gateways import hyperpay_gateway, stripe_gateway
from .models import HyperPayPayment, Order, OrderStatus, PaymentGateway, StripePayment

log = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _process_referral_reward(user, order):
    """منح نقاط مكافأة للمحيل بناءً على الكود المخزن في الطلب."""
    ref_code = order.referral_code
    if not ref_code:
        return

    from lms.djangoapps.academic_programs.models import UserReferral, CourseReferralReward
    try:
        referrer_info = UserReferral.objects.get(code=ref_code)
        # منع المستخدم من إحالة نفسه
        if referrer_info.user == user:
            return
            
        # منع تكرار المكافأة لنفس الطلب
        if CourseReferralReward.objects.filter(order=order).exists():
            return

        # منح النقاط بشكل ذري (100 نقطة للشراء) لضمان النزاهة المالية
        from django.db.models import F
        points = 100
        referrer_info.points = F('points') + points
        referrer_info.total_referred = F('total_referred') + 1
        referrer_info.save(update_fields=['points', 'total_referred'])
        referrer_info.refresh_from_db(fields=['points', 'total_referred'])
        
        # تسجيل المكافأة
        CourseReferralReward.objects.create(
            referrer=referrer_info,
            order=order,
            points_awarded=points
        )
        log.info('Awarded %d points to referrer %s for order %s', points, referrer_info.user.username, order.id)
    except Exception as exc:
        log.warning('Referral reward failed: %s', exc)





def _enroll_user(user, course_id):
    """Enroll user in verified mode after successful payment."""
    course_key = CourseKey.from_string(course_id)
    CourseEnrollment.enroll(user, course_key, mode='verified')
    log.info('Enrolled user %s in course %s (verified)', user.username, course_id)


def _revoke_enrollment(user, course_id):
    """Unenroll user from course after refund or failed payment."""
    course_key = CourseKey.from_string(course_id)
    CourseEnrollment.unenroll(user, course_key)
    log.warning('Revoked enrollment for user %s in course %s due to refund/failure', user.username, course_id)


def _get_course_price(course_id):
    """Return (price, currency) for a course, or (0, 'SAR') if free."""
    try:
        course_key = CourseKey.from_string(course_id)
        modes = CourseMode.modes_for_course_dict(course_key)
        verified = modes.get('verified')
        if verified and verified.min_price > 0:
            return verified.min_price, verified.currency.upper()
    except Exception:
        pass
    return 0, 'SAR'


# ──────────────────────────────────────────────
# Checkout page
# ──────────────────────────────────────────────

@login_required
@require_GET
def checkout(request):
    course_id = request.GET.get('course_id', '')
    if not course_id:
        return redirect('/dashboard/')

    price, currency = _get_course_price(course_id)
    if price == 0:
        _enroll_user(request.user, course_id)
        return redirect(f'/courses/{course_id}/courseware/')

    # منع الدفع المتكرر إذا كان الطالب مسجلاً بالفعل في الوضع المصدق
    course_key = CourseKey.from_string(course_id)
    enrollment = CourseEnrollment.get_enrollment(request.user, course_key)
    if enrollment and enrollment.is_active and enrollment.mode == 'verified':
        return redirect(f'/courses/{course_id}/courseware/')

    try:
        overview = CourseOverview.get_from_id(course_key)
        course_name = str(overview.display_name)
    except Exception:
        course_name = course_id

    from django.conf import settings as dj_settings
    stripe_pub_key = getattr(dj_settings, 'LEARNNOV_STRIPE_PUBLISHABLE_KEY', '')
    hyperpay_base = getattr(dj_settings, 'LEARNNOV_HYPERPAY_BASE_URL', 'https://eu-test.oppwa.com')

    context = {
        'course_id': course_id,
        'course_name': course_name,
        'price': price,
        'currency': currency,
        'stripe_publishable_key': stripe_pub_key,
        'hyperpay_script_url': f'{hyperpay_base}/v1/paymentWidgets.js',
        'LANGUAGE_CODE': get_language() or 'ar',
    }
    return render_to_response('learnnov_payments/checkout.html', context, request=request)


# ──────────────────────────────────────────────
# Stripe views
# ──────────────────────────────────────────────

@login_required
@require_POST
def stripe_create_intent(request):
    course_id = request.POST.get('course_id', '')
    if not course_id:
        return JsonResponse({'error': 'course_id مطلوب'}, status=400)

    price, currency = _get_course_price(course_id)
    if price == 0:
        return JsonResponse({'error': 'الدورة مجانية'}, status=400)

    try:
        course_name = str(
            CourseOverview.get_from_id(CourseKey.from_string(course_id)).display_name
        )
    except Exception:
        course_name = course_id

    # إنشاء الطلب مع التقاط كود الإحالة من الجلسة
    order = Order.objects.create(
        user=request.user,
        course_id=course_id,
        course_name=course_name,
        amount=price,
        currency=currency,
        gateway=PaymentGateway.STRIPE,
        referral_code=request.session.get('referral_code', ''),
    )

    try:
        intent_id, client_secret = stripe_gateway.create_payment_intent(order)
    except Exception as exc:
        log.error('Stripe create_intent error: %s', exc)
        order.status = OrderStatus.FAILED
        order.save(update_fields=['status'])
        return JsonResponse({'error': 'خطأ في بوابة الدفع'}, status=502)

    StripePayment.objects.create(
        order=order,
        payment_intent_id=intent_id,
        client_secret=client_secret,
    )
    return JsonResponse({'client_secret': client_secret, 'order_id': str(order.id)})


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Stripe sends events here. Must be registered in Stripe Dashboard."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    event_type, order_id, status = stripe_gateway.handle_webhook(payload, sig_header)
    if order_id is None:
        return HttpResponse(status=200) # Ignore unmapped events

    try:
        order = Order.objects.get(id=order_id)
        sp = order.stripe_payment
    except (Order.DoesNotExist, StripePayment.DoesNotExist):
        return HttpResponse(status=404)

    if status == 'paid':
        order.status = OrderStatus.PAID
        order.save(update_fields=['status'])
        sp.stripe_status = 'succeeded'
        sp.save(update_fields=['stripe_status'])
        _enroll_user(order.user, order.course_id)
        _process_referral_reward(order.user, order)
    elif status == 'refunded':
        order.status = OrderStatus.REFUNDED
        order.save(update_fields=['status'])
        sp.stripe_status = 'refunded'
        sp.save(update_fields=['stripe_status'])
        _revoke_enrollment(order.user, order.course_id)
    elif status == 'failed':
        order.status = OrderStatus.FAILED
        order.save(update_fields=['status'])
        sp.stripe_status = 'failed'
        sp.save(update_fields=['stripe_status'])

    return HttpResponse(status=200)


@login_required
@require_GET
def stripe_success(request):
    order_id = request.GET.get('order_id', '')
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return render(request, 'learnnov_payments/success.html', {'order': order})


@login_required
@require_POST
def hyperpay_initiate(request):
    course_id = request.POST.get('course_id', '')
    brand = request.POST.get('brand', 'VISA').upper()

    if brand not in ('VISA', 'MASTER', 'MADA'):
        return JsonResponse({'error': 'brand غير صالح'}, status=400)

    price, currency = _get_course_price(course_id)
    if price == 0:
        return JsonResponse({'error': 'الدورة مجانية'}, status=400)

    try:
        course_name = str(
            CourseOverview.get_from_id(CourseKey.from_string(course_id)).display_name
        )
    except Exception:
        course_name = course_id

    # إنشاء الطلب مع كود الإحالة
    order = Order.objects.create(
        user=request.user,
        course_id=course_id,
        course_name=course_name,
        amount=price,
        currency=currency,
        gateway=PaymentGateway.HYPERPAY,
        referral_code=request.session.get('referral_code', ''),
    )

    checkout_id, error = hyperpay_gateway.initiate_checkout(order, brand=brand)
    if error:
        order.status = OrderStatus.FAILED
        order.save(update_fields=['status'])
        return JsonResponse({'error': error}, status=502)

    HyperPayPayment.objects.create(
        order=order,
        checkout_id=checkout_id,
        brand=brand,
    )
    return JsonResponse({'checkout_id': checkout_id, 'order_id': str(order.id)})


@login_required
@require_GET
def hyperpay_callback(request):
    """
    HyperPay redirects here after the customer completes payment on the widget.
    Query params: resourcePath, id (checkout_id)
    """
    resource_path = request.GET.get('resourcePath', '')
    checkout_id = request.GET.get('id', '')
    
    if not resource_path or not checkout_id:
        return render(request, 'learnnov_payments/failed.html', {})

    from django.db import transaction
    
    with transaction.atomic():
        # استخدام select_for_update لقفل السجل ومنع التحديثات المتزامنة من Callback و Notify
        try:
            hp = HyperPayPayment.objects.select_for_update().get(checkout_id=checkout_id)
            order = hp.order
        except HyperPayPayment.DoesNotExist:
            log.error('HyperPay callback error: Checkout ID %s not found', checkout_id)
            return render(request, 'learnnov_payments/failed.html', {})

        # التحقق من الدفع باستخدام الكيان الصحيح (Entity ID)
        succeeded, is_refund, result_code, raw = hyperpay_gateway.verify_payment(resource_path, brand=hp.brand)

        hp.resource_path = resource_path
        hp.hyperpay_status = result_code
        hp.raw_response = raw
        hp.save(update_fields=['resource_path', 'hyperpay_status', 'raw_response'])

        if succeeded and order.status != OrderStatus.PAID:
            order.status = OrderStatus.PAID
            order.save(update_fields=['status'])
            _enroll_user(order.user, order.course_id)
            _process_referral_reward(order.user, order)
            return render(request, 'learnnov_payments/success.html', {'order': order})
        elif is_refund:
            order.status = OrderStatus.REFUNDED
            order.save(update_fields=['status'])
            _revoke_enrollment(order.user, order.course_id)
            return render(request, 'learnnov_payments/failed.html', {'result_code': 'refunded'})
        elif order.status == OrderStatus.PAID:
            # إذا كان قد تم التحديث بالفعل عبر الـ Notify
            return render(request, 'learnnov_payments/success.html', {'order': order})

        order.status = OrderStatus.FAILED
        order.save(update_fields=['status'])
        return render(request, 'learnnov_payments/failed.html', {'result_code': result_code})


@csrf_exempt
@require_POST
def hyperpay_notify(request):
    """Server-to-server notification from HyperPay."""
    import json
    from django.db import transaction
    
    try:
        data = json.loads(request.body)
    except Exception:
        return HttpResponse(status=400)

    resource_path = data.get('resourcePath', '')
    if not resource_path:
        return HttpResponse(status=400)

    # جلب الطلب وبياناته مسبقاً للتحقق من الـ Entity ID الصحيح (Mada vs Visa)
    from .models import Order, HyperPayPayment
    order_id = data.get('merchantTransactionId', '')
    import uuid
    try:
        uuid.UUID(str(order_id))
    except ValueError:
        return HttpResponse(status=400)

    brand = 'VISA'
    try:
        hp_entry = HyperPayPayment.objects.get(order_id=order_id)
        brand = hp_entry.brand
    except HyperPayPayment.DoesNotExist:
        # إذا لم نجد السجل، قد يكون طلباً قديماً أو خطأ في المرجع، سنحاول الاستمرار بالـ Default
        pass

    # التحقق من الدفع مع تمرير الـ Brand الصحيح لضمان استخدام الـ Entity ID المطابق
    succeeded, is_refund, result_code, raw = hyperpay_gateway.verify_payment(resource_path, brand=brand)
    order_id = raw.get('merchantTransactionId', '')
    try:
        uuid.UUID(str(order_id))
    except ValueError:
        return HttpResponse(status=400)

    with transaction.atomic():
        try:
            order = Order.objects.select_for_update().get(id=order_id)
            hp = order.hyperpay_payment
        except (Order.DoesNotExist, HyperPayPayment.DoesNotExist, ValueError, TypeError):
            return HttpResponse(status=404)

        if succeeded and order.status != OrderStatus.PAID:
            order.status = OrderStatus.PAID
            order.save(update_fields=['status'])
            hp.hyperpay_status = result_code
            hp.raw_response = raw
            hp.save(update_fields=['hyperpay_status', 'raw_response'])
            _enroll_user(order.user, order.course_id)
            _process_referral_reward(order.user, order)
        elif is_refund:
            order.status = OrderStatus.REFUNDED
            order.save(update_fields=['status'])
            hp.hyperpay_status = result_code
            hp.raw_response = raw
            hp.save(update_fields=['hyperpay_status', 'raw_response'])
            _revoke_enrollment(order.user, order.course_id)

    return HttpResponse(status=200)
