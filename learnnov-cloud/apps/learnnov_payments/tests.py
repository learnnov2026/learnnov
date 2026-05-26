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
