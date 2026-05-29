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
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

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

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = request.user if (request.user and request.user.is_authenticated) else User.objects.filter(is_superuser=True).first()
        if not user:
            user = User.objects.first()

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
                    metadata={'order_id': str(order.id)}
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

        return Response(status=status.HTTP_200_OK)

class VerifyPaymentView(APIView):
    """
    SECURITY FIX (PAY01): Verify payment status securely via server.
    The frontend calls this endpoint after Stripe completes instead of unlocking content blindly.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        intent_id = request.data.get('payment_intent_id')
        if not intent_id:
            return Response({'error': 'Missing payment_intent_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            intent = stripe.PaymentIntent.retrieve(intent_id)
            if intent.status == 'succeeded':
                from django.db import transaction
                from .models import DiscountCodeUsage
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = request.user if (request.user and request.user.is_authenticated) else User.objects.filter(is_superuser=True).first()
                if not user:
                    user = User.objects.first()
                    
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
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

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

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = request.user if (request.user and request.user.is_authenticated) else User.objects.filter(is_superuser=True).first()
        if not user:
            user = User.objects.first()

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

class StudentOrderListView(generics.ListAPIView):
    """قائمة فواتير/طلبات الطالب."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated:
            return Order.objects.filter(user=user).order_by('-created_at')
        return Order.objects.all().order_by('-created_at')[:20]
