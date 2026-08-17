import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('course_id', models.CharField(max_length=255, verbose_name='معرّف الدورة')),
                ('course_name', models.CharField(blank=True, max_length=500, verbose_name='اسم الدورة')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='المبلغ')),
                ('currency', models.CharField(default='SAR', max_length=3, verbose_name='العملة')),
                ('status', models.CharField(
                    choices=[('pending', 'قيد الانتظار'), ('paid', 'مدفوع'), ('failed', 'فشل'), ('refunded', 'مسترجع')],
                    default='pending', max_length=20, verbose_name='الحالة',
                )),
                ('gateway', models.CharField(
                    choices=[('stripe', 'Stripe'), ('hyperpay', 'HyperPay')],
                    max_length=20, verbose_name='بوابة الدفع',
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='orders',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'verbose_name': 'طلب شراء', 'verbose_name_plural': 'طلبات الشراء', 'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='StripePayment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('payment_intent_id', models.CharField(max_length=200, unique=True)),
                ('client_secret', models.CharField(max_length=500)),
                ('stripe_status', models.CharField(blank=True, max_length=50)),
                ('raw_response', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='stripe_payment',
                    to='learnnov_payments.order',
                )),
            ],
            options={'verbose_name': 'دفعة Stripe', 'verbose_name_plural': 'دفعات Stripe'},
        ),
        migrations.CreateModel(
            name='HyperPayPayment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('checkout_id', models.CharField(max_length=200, unique=True)),
                ('resource_path', models.CharField(blank=True, max_length=500)),
                ('hyperpay_status', models.CharField(blank=True, max_length=10)),
                ('brand', models.CharField(blank=True, max_length=20, verbose_name='نوع البطاقة')),
                ('raw_response', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='hyperpay_payment',
                    to='learnnov_payments.order',
                )),
            ],
            options={'verbose_name': 'دفعة HyperPay', 'verbose_name_plural': 'دفعات HyperPay'},
        ),
    ]
