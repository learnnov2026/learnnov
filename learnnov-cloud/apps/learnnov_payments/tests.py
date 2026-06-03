from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.academic_programs.models import AcademicProgram, ProgramProvider
from apps.learnnov_payments.models import DiscountCode, DiscountCodeUsage, Order, OrderStatus
import stripe
from unittest.mock import patch

User = get_user_model()

class PaymentSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        
        self.provider = ProgramProvider.objects.create(name='Provider A', slug='prov-a')
        self.program = AcademicProgram.objects.create(
            provider=self.provider,
            title='Program A',
            slug='prog-a',
            tuition_fee=500.00,
            degree_level='diploma'
        )
        
        self.discount = DiscountCode.objects.create(
            code='FREE100',
            discount_percentage=100.00,
            max_uses_total=2,
            max_uses_per_user=1
        )

    def test_price_manipulation_rejected(self):
        # Even if frontend sends amount=10, the server should ignore it
        # However, our fix actually rejects it if the frontend doesn't even send course_id
        url = reverse('learnnov_payments:stripe-create-intent')
        data = {
            'course_id': 'prog-a',
            'amount': 10.00 # Malicious amount
        }
        
        # We need to mock stripe.PaymentIntent.create since it makes a real API call
        with patch('stripe.PaymentIntent.create') as mock_stripe:
            mock_stripe.return_value.id = 'pi_test123'
            mock_stripe.return_value.client_secret = 'secret_test123'
            
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify the order amount matches the DB, not the malicious request
            order = Order.objects.get(id=response.data['order_id'])
            self.assertEqual(order.amount, 500.00)

    def test_100_percent_discount_limit(self):
        url = reverse('learnnov_payments:discount-apply')
        data = {
            'course_id': 'prog-a',
            'code': 'FREE100'
        }
        
        # 1st time: success
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # 2nd time: should fail due to per_user limit
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already used', response.data['error'])

    def test_anonymous_requests_rejected(self):
        # Disconnect authentication for testing anonymous behavior
        self.client.force_authenticate(user=None)

        # 1. Stripe payment intent creation should be rejected
        url_stripe = reverse('learnnov_payments:stripe-create-intent')
        response = self.client.post(url_stripe, {'course_id': 'prog-a'}, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        # 2. Discount code application should be rejected
        url_discount = reverse('learnnov_payments:discount-apply')
        response = self.client.post(url_discount, {'course_id': 'prog-a', 'code': 'FREE100'}, format='json')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        # 3. Accessing order list should be rejected
        url_orders = reverse('learnnov_payments:student-orders')
        response = self.client.get(url_orders)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_order_list_restricted_to_owner(self):
        # Create another user and an order belonging to them
        other_user = User.objects.create_user(username='otheruser', password='password123')
        Order.objects.create(user=other_user, course_id='prog-a', amount=500.00, status=OrderStatus.PAID)

        # Create an order belonging to self.user
        Order.objects.create(user=self.user, course_id='prog-a', amount=500.00, status=OrderStatus.PENDING)

        # Retrieve orders as self.user
        url_orders = reverse('learnnov_payments:student-orders')
        response = self.client.get(url_orders)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify that only 1 order (the one belonging to self.user) is returned, and other_user's order is not leaked
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], OrderStatus.PENDING)
