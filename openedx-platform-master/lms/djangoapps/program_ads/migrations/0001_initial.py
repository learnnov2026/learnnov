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
            name='AdPlacement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='الاسم')),
                ('slug', models.SlugField(max_length=100, unique=True, verbose_name='المعرف')),
                ('placement_type', models.CharField(choices=[('banner_top', 'بانر رأس الصفحة'), ('banner_bottom', 'بانر أسفل الصفحة'), ('sidebar', 'الشريط الجانبي'), ('program_card', 'بطاقة البرنامج'), ('search_results', 'نتائج البحث'), ('dashboard', 'لوحة المتعلم'), ('course_page', 'صفحة المقرر'), ('popup', 'نافذة منبثقة')], max_length=30, verbose_name='نوع المكان')),
                ('description', models.TextField(blank=True, verbose_name='الوصف')),
                ('max_width', models.PositiveSmallIntegerField(default=728, verbose_name='أقصى عرض (px)')),
                ('max_height', models.PositiveSmallIntegerField(default=90, verbose_name='أقصى ارتفاع (px)')),
                ('is_active', models.BooleanField(default=True, verbose_name='نشط')),
                ('base_price_per_day', models.DecimalField(decimal_places=2, default=100, max_digits=8, verbose_name='السعر الأساسي/يوم')),
            ],
            options={
                'verbose_name': 'مكان الإعلان',
                'verbose_name_plural': 'أماكن الإعلانات',
                'ordering': ['placement_type', 'name'],
            },
        ),
        migrations.CreateModel(
            name='Advertisement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='عنوان الإعلان')),
                ('advertiser_name', models.CharField(max_length=200, verbose_name='اسم المعلن')),
                ('advertiser_email', models.EmailField(max_length=254, verbose_name='بريد المعلن')),
                ('ad_type', models.CharField(choices=[('image', 'صورة'), ('text', 'نص'), ('video', 'فيديو'), ('html', 'HTML مخصص')], default='image', max_length=20, verbose_name='نوع الإعلان')),
                ('image', models.ImageField(blank=True, null=True, upload_to='ads/images/', verbose_name='الصورة')),
                ('video_url', models.URLField(blank=True, verbose_name='رابط الفيديو')),
                ('html_content', models.TextField(blank=True, verbose_name='محتوى HTML')),
                ('headline', models.CharField(blank=True, max_length=100, verbose_name='العنوان الرئيسي')),
                ('body_text', models.TextField(blank=True, verbose_name='النص')),
                ('call_to_action', models.CharField(default='اعرف أكثر', max_length=50, verbose_name='نص الزر')),
                ('destination_url', models.URLField(verbose_name='الرابط المستهدف')),
                ('alt_text', models.CharField(blank=True, max_length=200, verbose_name='النص البديل')),
                ('target_gender', models.CharField(choices=[('all', 'الكل'), ('male', 'ذكر'), ('female', 'أنثى')], default='all', max_length=10, verbose_name='الجنس المستهدف')),
                ('target_countries', models.JSONField(blank=True, default=list, help_text='قائمة رموز الدول: ["SA", "AE", "EG"]', verbose_name='الدول المستهدفة')),
                ('target_age_min', models.PositiveSmallIntegerField(default=0, verbose_name='الحد الأدنى للعمر')),
                ('target_age_max', models.PositiveSmallIntegerField(default=0, help_text='0 = بلا حد', verbose_name='الحد الأقصى للعمر')),
                ('target_interests', models.JSONField(blank=True, default=list, help_text='مجالات دراسية slug', verbose_name='الاهتمامات المستهدفة')),
                ('target_degree_levels', models.JSONField(blank=True, default=list, verbose_name='المستويات الأكاديمية')),
                ('status', models.CharField(choices=[('draft', 'مسودة'), ('pending', 'قيد المراجعة'), ('approved', 'موافق عليه'), ('active', 'نشط'), ('paused', 'موقوف مؤقتاً'), ('expired', 'منتهي'), ('rejected', 'مرفوض')], default='draft', max_length=20, verbose_name='الحالة')),
                ('start_date', models.DateTimeField(verbose_name='تاريخ البدء')),
                ('end_date', models.DateTimeField(verbose_name='تاريخ الانتهاء')),
                ('daily_budget', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='الميزانية اليومية')),
                ('total_budget', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='الميزانية الإجمالية')),
                ('cost_per_click', models.DecimalField(decimal_places=2, default=0, max_digits=6, verbose_name='التكلفة لكل نقرة')),
                ('cost_per_impression', models.DecimalField(decimal_places=3, default=0, max_digits=6, verbose_name='التكلفة لكل ظهور')),
                ('total_impressions', models.PositiveIntegerField(default=0, verbose_name='إجمالي الظهور')),
                ('total_clicks', models.PositiveIntegerField(default=0, verbose_name='إجمالي النقرات')),
                ('total_spent', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='إجمالي الإنفاق')),
                ('priority', models.PositiveSmallIntegerField(default=5, help_text='1 أعلى، 10 أدنى', verbose_name='الأولوية')),
                ('is_premium', models.BooleanField(default=False, verbose_name='إعلان مميز')),
                ('reviewer_notes', models.TextField(blank=True, verbose_name='ملاحظات المراجع')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('placement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='advertisements', to='program_ads.adplacement', verbose_name='مكان العرض')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_ads', to=settings.AUTH_USER_MODEL, verbose_name='أنشأه')),
            ],
            options={
                'verbose_name': 'إعلان',
                'verbose_name_plural': 'الإعلانات',
                'ordering': ['priority', '-is_premium', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='advertisement',
            index=models.Index(fields=['status', 'start_date', 'end_date'], name='program_ads_status_date_idx'),
        ),
        migrations.AddIndex(
            model_name='advertisement',
            index=models.Index(fields=['placement', 'status'], name='program_ads_placement_idx'),
        ),
        migrations.CreateModel(
            name='AdImpression',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(choices=[('impression', 'ظهور'), ('click', 'نقرة')], max_length=20, verbose_name='نوع الحدث')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='عنوان IP')),
                ('user_agent', models.CharField(blank=True, max_length=500, verbose_name='المتصفح')),
                ('referrer', models.URLField(blank=True, verbose_name='المرجع')),
                ('session_key', models.CharField(blank=True, max_length=40, verbose_name='الجلسة')),
                ('country_code', models.CharField(blank=True, max_length=2, verbose_name='الدولة')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('advertisement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='impressions', to='program_ads.advertisement', verbose_name='الإعلان')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='ad_interactions', to=settings.AUTH_USER_MODEL, verbose_name='المستخدم')),
            ],
            options={
                'verbose_name': 'تفاعل مع إعلان',
                'verbose_name_plural': 'تفاعلات الإعلانات',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='adimpression',
            index=models.Index(fields=['advertisement', 'event_type', 'created_at'], name='program_ads_imp_ad_evt_idx'),
        ),
        migrations.AddIndex(
            model_name='adimpression',
            index=models.Index(fields=['created_at'], name='program_ads_imp_created_idx'),
        ),
    ]
