import django.core.validators
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
            name='FieldOfStudy',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='الاسم')),
                ('name_en', models.CharField(blank=True, max_length=200, verbose_name='الاسم بالإنجليزية')),
                ('slug', models.SlugField(max_length=100, unique=True, verbose_name='المعرف')),
                ('icon', models.CharField(blank=True, help_text='Font Awesome class', max_length=50, verbose_name='أيقونة')),
                ('description', models.TextField(blank=True, verbose_name='الوصف')),
                ('is_active', models.BooleanField(default=True, verbose_name='نشط')),
                ('sort_order', models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='subfields', to='academic_programs.fieldofstudy', verbose_name='المجال الرئيسي')),
            ],
            options={
                'verbose_name': 'مجال دراسي',
                'verbose_name_plural': 'المجالات الدراسية',
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='ProgramProvider',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='الاسم')),
                ('name_en', models.CharField(blank=True, max_length=200, verbose_name='الاسم بالإنجليزية')),
                ('slug', models.SlugField(max_length=100, unique=True, verbose_name='المعرف')),
                ('provider_type', models.CharField(choices=[('university', 'جامعة'), ('college', 'كلية'), ('institute', 'معهد'), ('center', 'مركز تدريب')], default='university', max_length=20, verbose_name='النوع')),
                ('country', models.CharField(default='Saudi Arabia', max_length=100, verbose_name='الدولة')),
                ('city', models.CharField(blank=True, max_length=100, verbose_name='المدينة')),
                ('logo', models.ImageField(blank=True, null=True, upload_to='providers/logos/', verbose_name='الشعار')),
                ('website', models.URLField(blank=True, verbose_name='الموقع الإلكتروني')),
                ('description', models.TextField(blank=True, verbose_name='الوصف')),
                ('accreditation', models.CharField(choices=[('national', 'وطنية'), ('international', 'دولية'), ('both', 'وطنية ودولية'), ('none', 'غير معتمدة')], default='national', max_length=20, verbose_name='الاعتماد')),
                ('is_active', models.BooleanField(default=True, verbose_name='نشط')),
                ('is_verified', models.BooleanField(default=False, verbose_name='موثق')),
                ('contact_email', models.EmailField(blank=True, max_length=254, verbose_name='البريد الإلكتروني')),
                ('contact_phone', models.CharField(blank=True, max_length=20, verbose_name='الهاتف')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'مزود برامج',
                'verbose_name_plural': 'مزودو البرامج',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='AcademicProgram',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=300, verbose_name='عنوان البرنامج')),
                ('title_en', models.CharField(blank=True, max_length=300, verbose_name='العنوان بالإنجليزية')),
                ('slug', models.SlugField(max_length=200, unique=True, verbose_name='المعرف')),
                ('degree_level', models.CharField(choices=[('certificate', 'شهادة'), ('diploma', 'دبلوم'), ('bachelor', 'بكالوريوس'), ('master', 'ماجستير'), ('phd', 'دكتوراه'), ('professional', 'شهادة مهنية')], max_length=20, verbose_name='المستوى الأكاديمي')),
                ('study_mode', models.CharField(choices=[('online', 'عن بُعد بالكامل'), ('blended', 'مدمج'), ('on_campus', 'حضوري')], default='online', max_length=20, verbose_name='طريقة الدراسة')),
                ('language', models.CharField(choices=[('ar', 'العربية'), ('en', 'الإنجليزية'), ('ar_en', 'عربي وإنجليزي')], default='ar', max_length=10, verbose_name='لغة الدراسة')),
                ('duration_months', models.PositiveSmallIntegerField(default=12, verbose_name='المدة (أشهر)')),
                ('credit_hours', models.PositiveSmallIntegerField(default=0, verbose_name='الساعات المعتمدة')),
                ('description', models.TextField(verbose_name='الوصف')),
                ('objectives', models.TextField(blank=True, verbose_name='الأهداف')),
                ('requirements', models.TextField(blank=True, verbose_name='متطلبات القبول')),
                ('curriculum_overview', models.TextField(blank=True, verbose_name='نظرة على المناهج')),
                ('tuition_fee', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='الرسوم الدراسية')),
                ('currency', models.CharField(default='SAR', max_length=5, verbose_name='العملة')),
                ('scholarship_available', models.BooleanField(default=False, verbose_name='منح متاحة')),
                ('status', models.CharField(choices=[('draft', 'مسودة'), ('review', 'قيد المراجعة'), ('active', 'نشط'), ('closed', 'مغلق'), ('archived', 'مؤرشف')], default='draft', max_length=20, verbose_name='الحالة')),
                ('is_active', models.BooleanField(default=True, verbose_name='نشط')),
                ('is_featured', models.BooleanField(default=False, verbose_name='مميز')),
                ('application_deadline', models.DateField(blank=True, null=True, verbose_name='آخر موعد للتقديم')),
                ('start_date', models.DateField(blank=True, null=True, verbose_name='تاريخ البدء')),
                ('max_students', models.PositiveIntegerField(default=0, help_text='0 = غير محدود', verbose_name='الحد الأقصى للطلاب')),
                ('cover_image', models.ImageField(blank=True, null=True, upload_to='programs/covers/', verbose_name='صورة الغلاف')),
                ('brochure', models.FileField(blank=True, null=True, upload_to='programs/brochures/', verbose_name='البروشور')),
                ('edx_course_keys', models.JSONField(blank=True, default=list, verbose_name='مقررات edX المرتبطة')),
                ('views_count', models.PositiveIntegerField(default=0, verbose_name='عدد المشاهدات')),
                ('applications_count', models.PositiveIntegerField(default=0, verbose_name='عدد الطلبات')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('provider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='programs', to='academic_programs.programprovider', verbose_name='المؤسسة')),
                ('field_of_study', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='programs', to='academic_programs.fieldofstudy', verbose_name='المجال الدراسي')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_programs', to=settings.AUTH_USER_MODEL, verbose_name='أنشأه')),
            ],
            options={
                'verbose_name': 'برنامج أكاديمي',
                'verbose_name_plural': 'البرامج الأكاديمية',
                'ordering': ['-is_featured', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='academicprogram',
            index=models.Index(fields=['status', 'is_active'], name='academic_pr_status_idx'),
        ),
        migrations.AddIndex(
            model_name='academicprogram',
            index=models.Index(fields=['provider', 'degree_level'], name='academic_pr_provider_idx'),
        ),
        migrations.AddIndex(
            model_name='academicprogram',
            index=models.Index(fields=['field_of_study'], name='academic_pr_field_idx'),
        ),
        migrations.CreateModel(
            name='ProgramApplication',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('submitted', 'مقدم'), ('under_review', 'قيد المراجعة'), ('accepted', 'مقبول'), ('rejected', 'مرفوض'), ('waitlisted', 'قائمة الانتظار'), ('withdrawn', 'منسحب')], default='submitted', max_length=20, verbose_name='الحالة')),
                ('full_name', models.CharField(max_length=200, verbose_name='الاسم الكامل')),
                ('email', models.EmailField(max_length=254, verbose_name='البريد الإلكتروني')),
                ('phone', models.CharField(max_length=20, verbose_name='الهاتف')),
                ('nationality', models.CharField(blank=True, max_length=100, verbose_name='الجنسية')),
                ('date_of_birth', models.DateField(blank=True, null=True, verbose_name='تاريخ الميلاد')),
                ('highest_qualification', models.CharField(blank=True, max_length=200, verbose_name='أعلى مؤهل')),
                ('graduation_year', models.PositiveSmallIntegerField(blank=True, null=True, verbose_name='سنة التخرج')),
                ('gpa', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(4)], verbose_name='المعدل التراكمي')),
                ('work_experience_years', models.PositiveSmallIntegerField(default=0, verbose_name='سنوات الخبرة')),
                ('personal_statement', models.TextField(blank=True, verbose_name='الخطة الشخصية')),
                ('cv', models.FileField(blank=True, null=True, upload_to='applications/cvs/', verbose_name='السيرة الذاتية')),
                ('transcripts', models.FileField(blank=True, null=True, upload_to='applications/transcripts/', verbose_name='كشف الدرجات')),
                ('additional_docs', models.FileField(blank=True, null=True, upload_to='applications/docs/', verbose_name='مستندات إضافية')),
                ('reviewer_notes', models.TextField(blank=True, verbose_name='ملاحظات المراجع')),
                ('reviewed_at', models.DateTimeField(blank=True, null=True, verbose_name='تاريخ المراجعة')),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('program', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='applications', to='academic_programs.academicprogram', verbose_name='البرنامج')),
                ('applicant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='program_applications', to=settings.AUTH_USER_MODEL, verbose_name='المتقدم')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_applications', to=settings.AUTH_USER_MODEL, verbose_name='راجعه')),
            ],
            options={
                'verbose_name': 'طلب تقديم',
                'verbose_name_plural': 'طلبات التقديم',
                'ordering': ['-submitted_at'],
            },
        ),
        migrations.AddIndex(
            model_name='programapplication',
            index=models.Index(fields=['status'], name='program_app_status_idx'),
        ),
        migrations.AddIndex(
            model_name='programapplication',
            index=models.Index(fields=['program', 'status'], name='program_app_prog_status_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='programapplication',
            unique_together={('program', 'applicant')},
        ),
    ]
