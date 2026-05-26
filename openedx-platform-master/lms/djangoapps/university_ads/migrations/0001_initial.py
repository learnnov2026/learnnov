import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='University',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='اسم الجامعة')),
                ('name_ar', models.CharField(blank=True, max_length=200, verbose_name='الاسم بالعربية')),
                ('logo', models.ImageField(blank=True, null=True, upload_to='universities/logos/', verbose_name='الشعار')),
                ('website', models.URLField(blank=True, verbose_name='الموقع الرسمي')),
                ('is_active', models.BooleanField(default=True, verbose_name='نشطة')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('staff_user', models.OneToOneField(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='university',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='حساب المشرف',
                )),
            ],
            options={'verbose_name': 'جامعة', 'verbose_name_plural': 'الجامعات'},
        ),
        migrations.CreateModel(
            name='UniversityAd',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='عنوان الإعلان')),
                ('description', models.TextField(blank=True, verbose_name='وصف مختصر')),
                ('image', models.ImageField(upload_to='university_ads/', verbose_name='صورة الإعلان')),
                ('link_url', models.URLField(verbose_name='رابط الإعلان')),
                ('placement', models.CharField(
                    choices=[
                        ('dashboard_top', 'أعلى لوحة التحكم'),
                        ('dashboard_sidebar', 'شريط جانبي - لوحة التحكم'),
                        ('search_top', 'أعلى صفحة البحث'),
                        ('search_sidebar', 'شريط جانبي - البحث'),
                        ('catalog', 'كتالوج الدورات'),
                    ],
                    default='dashboard_top',
                    max_length=30,
                    verbose_name='موضع الإعلان',
                )),
                ('priority', models.PositiveSmallIntegerField(default=10, verbose_name='الأولوية (أقل = أعلى)')),
                ('is_active', models.BooleanField(default=True, verbose_name='نشط')),
                ('start_date', models.DateTimeField(verbose_name='تاريخ البداية')),
                ('end_date', models.DateTimeField(verbose_name='تاريخ النهاية')),
                ('max_impressions', models.PositiveIntegerField(default=0, verbose_name='الحد الأقصى للمشاهدات (0 = غير محدود)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('university', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ads',
                    to='university_ads.University',
                    verbose_name='الجامعة',
                )),
            ],
            options={'verbose_name': 'إعلان جامعي', 'verbose_name_plural': 'الإعلانات الجامعية', 'ordering': ['priority', '-created_at']},
        ),
        migrations.CreateModel(
            name='AdImpression',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('page', models.CharField(blank=True, max_length=100)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('ad', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='impressions',
                    to='university_ads.UniversityAd',
                )),
                ('user', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'verbose_name': 'مشاهدة', 'verbose_name_plural': 'المشاهدات'},
        ),
        migrations.CreateModel(
            name='AdClick',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('ad', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='clicks',
                    to='university_ads.UniversityAd',
                )),
                ('user', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'verbose_name': 'نقرة', 'verbose_name_plural': 'النقرات'},
        ),
    ]
