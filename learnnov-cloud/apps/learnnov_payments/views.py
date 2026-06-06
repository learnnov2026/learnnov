from rest_framework import generics, serializers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .models import Order, StripePayment, HyperPayPayment, OrderStatus, PaymentGateway
import stripe

stripe.api_key = getattr(settings, 'LEARNNOV_STRIPE_SECRET_KEY', '')

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['id', 'user', 'status', 'created_at']

class CreateStripePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        
        if not course_id:
            return Response({'error': 'Missing data'}, status=status.HTTP_400_BAD_REQUEST)

        # SECURITY FIX (PAY02): Fetch price securely from backend
        from apps.academic_programs.models import AcademicProgram
        from .models import DiscountCode, DiscountCodeUsage
        from django.utils import timezone
        
        try:
            # Assuming course_id maps to program slug or ID. Adjust lookup as needed.
            program = AcademicProgram.objects.get(slug=course_id)
            amount = program.tuition_fee
        except AcademicProgram.DoesNotExist:
            return Response({'error': 'Invalid course_id'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        from django.core.cache import cache
        lock_key = f"lock:order:{user.id}:{course_id}"
        lock_acquired = cache.add(lock_key, "true", timeout=15)
        if not lock_acquired:
            return Response({'error': 'الطلب قيد المعالجة حالياً. يرجى الانتظار.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            discount_code_str = request.data.get('discount_code')
            discount_obj = None
            if discount_code_str:
                try:
                    discount_obj = DiscountCode.objects.get(code__iexact=discount_code_str, is_active=True)
                    if discount_obj.expiration_date and discount_obj.expiration_date < timezone.now():
                        return Response({'error': 'Discount code has expired'}, status=status.HTTP_400_BAD_REQUEST)
                    if discount_obj.valid_programs.exists() and not discount_obj.valid_programs.filter(id=program.id).exists():
                        return Response({'error': 'Discount code is not valid for this program'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    total_uses = DiscountCodeUsage.objects.filter(discount_code=discount_obj).count()
                    if total_uses >= discount_obj.max_uses_total:
                        return Response({'error': 'Discount code usage limit reached'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    user_uses = DiscountCodeUsage.objects.filter(discount_code=discount_obj, user=user).count()
                    if user_uses >= discount_obj.max_uses_per_user:
                        return Response({'error': 'You have already used this discount code'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Apply discount
                    import decimal
                    amount = amount * decimal.Decimal(1 - (discount_obj.discount_percentage / 100))
                    amount = max(amount, decimal.Decimal('0.00'))
                except DiscountCode.DoesNotExist:
                    return Response({'error': 'Invalid discount code'}, status=status.HTTP_400_BAD_REQUEST)

            from django.db import transaction
            
            with transaction.atomic():
                # Prevent double subscription race condition
                order, created = Order.objects.get_or_create(
                    user=user,
                    course_id=course_id,
                    gateway=PaymentGateway.STRIPE,
                    status=OrderStatus.PENDING,
                    defaults={'amount': amount, 'program': program, 'discount_code': discount_obj}
                )
                
                if not created:
                    # Reuse existing pending order, but update amount if code changed
                    order.amount = amount
                    order.discount_code = discount_obj
                    order.save()

            try:
                from apps.core.circuit_breaker import circuit_breaker
                
                def create_intent(*args, **kwargs):
                    return stripe.PaymentIntent.create(
                        amount=int(float(amount) * 100),
                        currency='sar',
                        metadata={'order_id': str(order.id)},
                        request_timeout=8.0
                    )

                intent = circuit_breaker.call(create_intent)
                
                StripePayment.objects.create(
                    order=order,
                    payment_intent_id=intent.id,
                    client_secret=intent.client_secret
                )

                return Response({
                    'client_secret': intent.client_secret,
                    'order_id': order.id
                })
            except Exception as e:
                # Fallback handling
                return Response({'error': 'Payment service is currently unavailable. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        finally:
            cache.delete(lock_key)

class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = getattr(settings, 'LEARNNOV_STRIPE_WEBHOOK_SECRET', '')

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            return Response("Invalid signature", status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            from django.db import transaction
            from .models import DiscountCodeUsage
            
            try:
                with transaction.atomic():
                    payment = StripePayment.objects.select_related('order').select_for_update().get(payment_intent_id=intent.id)
                    order = payment.order
                    
                    if order.status != OrderStatus.PAID:
                        order.status = OrderStatus.PAID
                        order.save()
                        
                        if order.discount_code:
                            DiscountCodeUsage.objects.get_or_create(
                                discount_code=order.discount_code,
                                user=order.user,
                                order=order
                            )
            except StripePayment.DoesNotExist:
                pass

        elif event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            if session.get('mode') == 'subscription':
                user_id = session.get('client_reference_id')
                subscription_id = session.get('subscription')
                metadata = session.get('metadata', {})
                plan_id = metadata.get('plan_id')
                
                if user_id and plan_id:
                    from django.contrib.auth import get_user_model
                    from django.utils import timezone
                    from datetime import timedelta
                    from .models import UserSubscription, SubscriptionPlan
                    
                    User = get_user_model()
                    try:
                        user = User.objects.get(id=user_id)
                        plan = SubscriptionPlan.objects.get(id=plan_id)
                        
                        UserSubscription.objects.update_or_create(
                            user=user,
                            defaults={
                                'plan': plan,
                                'stripe_subscription_id': subscription_id,
                                'status': 'active',
                                'current_period_start': timezone.now(),
                                'current_period_end': timezone.now() + timedelta(days=30 if plan.billing_cycle == 'monthly' else 365),
                                'cancel_at_period_end': False
                            }
                        )
                    except Exception:
                        pass

        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            subscription_id = invoice.get('subscription')
            if subscription_id:
                from django.utils import timezone
                from datetime import timedelta
                from .models import UserSubscription
                try:
                    user_sub = UserSubscription.objects.get(stripe_subscription_id=subscription_id)
                    user_sub.status = 'active'
                    user_sub.current_period_start = timezone.now()
                    days = 30 if (user_sub.plan and user_sub.plan.billing_cycle == 'monthly') else 365
                    user_sub.current_period_end = timezone.now() + timedelta(days=days)
                    user_sub.save()
                except UserSubscription.DoesNotExist:
                    pass

        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            subscription_id = subscription.get('id')
            if subscription_id:
                from .models import UserSubscription
                try:
                    user_sub = UserSubscription.objects.get(stripe_subscription_id=subscription_id)
                    user_sub.status = 'expired'
                    user_sub.save()
                except UserSubscription.DoesNotExist:
                    pass

        return Response(status=status.HTTP_200_OK)

class VerifyPaymentView(APIView):
    """
    SECURITY FIX (PAY01): Verify payment status securely via server.
    The frontend calls this endpoint after Stripe completes instead of unlocking content blindly.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        intent_id = request.data.get('payment_intent_id')
        if not intent_id:
            return Response({'error': 'Missing payment_intent_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            intent = stripe.PaymentIntent.retrieve(intent_id, request_timeout=8.0)
            if intent.status == 'succeeded':
                from django.db import transaction
                from .models import DiscountCodeUsage
                user = request.user
                    
                with transaction.atomic():
                    payment = StripePayment.objects.select_related('order').select_for_update().get(payment_intent_id=intent_id)
                    order = payment.order
                    
                    if order.status != OrderStatus.PAID:
                        order.status = OrderStatus.PAID
                        order.save()
                        
                        if order.discount_code:
                            DiscountCodeUsage.objects.get_or_create(
                                discount_code=order.discount_code,
                                user=order.user,
                                order=order
                            )
                    
                    # Ensure user is the owner of the order
                    if order.user != user and user and not user.is_superuser:
                        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
                        
                return Response({'status': 'success', 'order_id': order.id})
            else:
                return Response({'error': 'Payment not verified'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Verification failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ApplyDiscountCodeView(APIView):
    """
    SECURITY FIX (PAY03): Secure Discount Code application enforcing limits.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        course_id = request.data.get('course_id')

        if not code or not course_id:
            return Response({'error': 'Missing data'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.academic_programs.models import AcademicProgram
        from .models import DiscountCode, DiscountCodeUsage

        try:
            program = AcademicProgram.objects.get(slug=course_id)
        except AcademicProgram.DoesNotExist:
            return Response({'error': 'Invalid course_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            discount = DiscountCode.objects.get(code__iexact=code, is_active=True)
        except DiscountCode.DoesNotExist:
            return Response({'error': 'Invalid or expired discount code'}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils import timezone
        if discount.expiration_date and discount.expiration_date < timezone.now():
            return Response({'error': 'Discount code has expired'}, status=status.HTTP_400_BAD_REQUEST)

        if discount.valid_programs.exists() and not discount.valid_programs.filter(id=program.id).exists():
            return Response({'error': 'Discount code is not valid for this program'}, status=status.HTTP_400_BAD_REQUEST)

        total_uses = DiscountCodeUsage.objects.filter(discount_code=discount).count()
        if total_uses >= discount.max_uses_total:
            return Response({'error': 'Discount code usage limit reached'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        from django.core.cache import cache
        lock_key = f"lock:discount:{user.id}:{code}"
        lock_acquired = cache.add(lock_key, "true", timeout=10)
        if not lock_acquired:
            return Response({'error': 'جاري معالجة كود الخصم حالياً. يرجى الانتظار.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_uses = DiscountCodeUsage.objects.filter(discount_code=discount, user=user).count()
            if user_uses >= discount.max_uses_per_user:
                return Response({'error': 'You have already used this discount code'}, status=status.HTTP_400_BAD_REQUEST)

            from django.db import transaction
            with transaction.atomic():
                # If 100% discount, fulfill order immediately
                if discount.discount_percentage == 100:
                    order, _ = Order.objects.get_or_create(
                        user=user,
                        course_id=course_id,
                        gateway=PaymentGateway.STRIPE,
                        defaults={'amount': 0, 'program': program}
                    )
                    order.status = OrderStatus.PAID
                    order.save()
                    
                    DiscountCodeUsage.objects.create(
                        discount_code=discount,
                        user=user,
                        order=order
                    )
                    return Response({'status': 'success', 'message': 'Course unlocked successfully with 100% discount.'})
                else:
                    return Response({'status': 'applied', 'discount_percentage': discount.discount_percentage})
        finally:
            cache.delete(lock_key)

class StudentOrderListView(generics.ListAPIView):
    """قائمة فواتير/طلبات الطالب."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


import uuid
from django.shortcuts import get_object_or_404
from .models import SubscriptionPlan, UserSubscription
from .serializers import SubscriptionPlanSerializer, UserSubscriptionSerializer

class SubscriptionPlanListView(generics.ListAPIView):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]


class UserSubscriptionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            sub = UserSubscription.objects.filter(user=request.user).latest('created_at')
            serializer = UserSubscriptionSerializer(sub)
            return Response(serializer.data)
        except UserSubscription.DoesNotExist:
            return Response({'status': 'none', 'message': 'لا يوجد اشتراك نشط حالياً.'}, status=status.HTTP_200_OK)


class CreateSubscriptionCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({'error': 'Missing plan_id'}, status=status.HTTP_400_BAD_REQUEST)

        plan = get_object_or_404(SubscriptionPlan, id=plan_id, is_active=True)
        user = request.user

        import stripe
        stripe.api_key = getattr(settings, 'LEARNNOV_STRIPE_SECRET_KEY', '')

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': plan.stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=settings.LEARNNOV_SITE_URL + '/payments?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=settings.LEARNNOV_SITE_URL + '/payments',
                client_reference_id=str(user.id),
                metadata={'plan_id': str(plan.id)}
            )
            return Response({'checkout_url': session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SimulateSubscriptionCheckoutView(APIView):
    """
    سيموليشن تجريبي لتفعيل الاشتراكات دون الحاجة للاتصال بـ Stripe الفعلي.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        action = request.data.get('action', 'activate')
        
        user = request.user
        
        if action == 'deactivate':
            UserSubscription.objects.filter(user=user).update(status='expired')
            return Response({'message': 'تم إلغاء الاشتراك التجريبي بنجاح.', 'status': 'expired'})

        if not plan_id:
            return Response({'error': 'Missing plan_id'}, status=status.HTTP_400_BAD_REQUEST)

        plan = get_object_or_404(SubscriptionPlan, id=plan_id, is_active=True)
        from django.utils import timezone
        from datetime import timedelta

        sub, created = UserSubscription.objects.update_or_create(
            user=user,
            defaults={
                'plan': plan,
                'stripe_subscription_id': f"sub_sim_{uuid.uuid4().hex[:12]}",
                'status': 'active',
                'current_period_start': timezone.now(),
                'current_period_end': timezone.now() + timedelta(days=30 if plan.billing_cycle == 'monthly' else 365),
                'cancel_at_period_end': False
            }
        )

        return Response({
            'message': 'تم تفعيل الاشتراك التجريبي بنجاح!',
            'status': sub.status,
            'current_period_end': sub.current_period_end
        })


class CancelSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            sub = UserSubscription.objects.filter(user=user, status='active').latest('created_at')
            
            if sub.stripe_subscription_id and not sub.stripe_subscription_id.startswith('sub_sim_'):
                import stripe
                stripe.api_key = getattr(settings, 'LEARNNOV_STRIPE_SECRET_KEY', '')
                try:
                    stripe.Subscription.modify(
                        sub.stripe_subscription_id,
                        cancel_at_period_end=True
                    )
                except Exception:
                    pass
            
            sub.cancel_at_period_end = True
            sub.save()
            return Response({'message': 'تم إلغاء التجديد التلقائي للاشتراك بنجاح.', 'cancel_at_period_end': True})
        except UserSubscription.DoesNotExist:
            return Response({'error': 'لا يوجد اشتراك نشط للالغاء.'}, status=status.HTTP_400_BAD_REQUEST)

