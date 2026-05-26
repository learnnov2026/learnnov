from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class ProgramProvider(models.Model):
    """جامعة أو مؤسسة تعليمية تقدم برامج أكاديمية."""

    PROVIDER_TYPES = [
        ('university', _('جامعة')),
        ('college', _('كلية')),
        ('institute', _('معهد')),
        ('center', _('مركز تدريب')),
    ]

    ACCREDITATION_CHOICES = [
        ('national', _('وطنية')),
        ('international', _('دولية')),
        ('both', _('وطنية ودولية')),
        ('none', _('غير معتمدة')),
    ]

    name = models.CharField(_('الاسم'), max_length=200)
    name_en = models.CharField(_('الاسم بالإنجليزية'), max_length=200, blank=True)
    slug = models.SlugField(_('المعرف'), max_length=100, unique=True, db_index=True)
    provider_type = models.CharField(_('النوع'), max_length=20, choices=PROVIDER_TYPES, default='university')
    country = models.CharField(_('الدولة'), max_length=100, default=_('Saudi Arabia'))
    city = models.CharField(_('المدينة'), max_length=100, blank=True)
    logo = models.ImageField(_('الشعار'), upload_to='providers/logos/', blank=True, null=True)
    website = models.URLField(_('الموقع الإلكتروني'), blank=True)
    description = models.TextField(_('الوصف'), blank=True)
    accreditation = models.CharField(_('الاعتماد'), max_length=20, choices=ACCREDITATION_CHOICES, default='national')
    is_active = models.BooleanField(_('نشط'), default=True)
    is_verified = models.BooleanField(_('موثق'), default=False)
    contact_email = models.EmailField(_('البريد الإلكتروني'), blank=True)
    contact_phone = models.CharField(_('الهاتف'), max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('مزود برامج')
        verbose_name_plural = _('مزودو البرامج')
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_active_programs_count(self):
        return self.programs.filter(is_active=True).count()


class FieldOfStudy(models.Model):
    """مجال دراسي (تخصص رئيسي)."""

    name = models.CharField(_('الاسم'), max_length=200)
    name_en = models.CharField(_('الاسم بالإنجليزية'), max_length=200, blank=True)
    slug = models.SlugField(_('المعرف'), max_length=100, unique=True, db_index=True)
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='subfields', verbose_name=_('المجال الرئيسي')
    )
    icon = models.CharField(_('أيقونة'), max_length=50, blank=True, help_text='Font Awesome class')
    description = models.TextField(_('الوصف'), blank=True)
    is_active = models.BooleanField(_('نشط'), default=True)
    sort_order = models.PositiveSmallIntegerField(_('الترتيب'), default=0)

    class Meta:
        verbose_name = _('مجال دراسي')
        verbose_name_plural = _('المجالات الدراسية')
        ordering = ['sort_order', 'name']

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} ← {self.name}"
        return self.name


class AcademicProgram(models.Model):
    """برنامج أكاديمي (دبلوم، بكالوريوس، ماجستير، إلخ)."""

    DEGREE_LEVELS = [
        ('certificate', _('شهادة')),
        ('diploma', _('دبلوم')),
        ('bachelor', _('بكالوريوس')),
        ('master', _('ماجستير')),
        ('phd', _('دكتوراه')),
        ('professional', _('شهادة مهنية')),
    ]

    STUDY_MODES = [
        ('online', _('عن بُعد بالكامل')),
        ('blended', _('مدمج')),
        ('on_campus', _('حضوري')),
    ]

    LANGUAGES = [
        ('ar', _('العربية')),
        ('en', _('الإنجليزية')),
        ('ar_en', _('عربي وإنجليزي')),
    ]

    STATUS_CHOICES = [
        ('draft', _('مسودة')),
        ('review', _('قيد المراجعة')),
        ('active', _('نشط')),
        ('closed', _('مغلق')),
        ('archived', _('مؤرشف')),
    ]

    provider = models.ForeignKey(
        ProgramProvider, on_delete=models.CASCADE,
        related_name='programs', verbose_name=_('المؤسسة')
    )
    field_of_study = models.ForeignKey(
        FieldOfStudy, on_delete=models.SET_NULL, null=True,
        related_name='programs', verbose_name=_('المجال الدراسي')
    )
    title = models.CharField(_('عنوان البرنامج'), max_length=300)
    title_en = models.CharField(_('العنوان بالإنجليزية'), max_length=300, blank=True)
    slug = models.SlugField(_('المعرف'), max_length=200, unique=True, db_index=True)
    degree_level = models.CharField(_('المستوى الأكاديمي'), max_length=20, choices=DEGREE_LEVELS)
    study_mode = models.CharField(_('طريقة الدراسة'), max_length=20, choices=STUDY_MODES, default='online')
    language = models.CharField(_('لغة الدراسة'), max_length=10, choices=LANGUAGES, default='ar')
    duration_months = models.PositiveSmallIntegerField(_('المدة (أشهر)'), default=12)
    credit_hours = models.PositiveSmallIntegerField(_('الساعات المعتمدة'), default=0)
    description = models.TextField(_('الوصف'))
    objectives = models.TextField(_('الأهداف'), blank=True)
    requirements = models.TextField(_('متطلبات القبول'), blank=True)
    curriculum_overview = models.TextField(_('نظرة على المناهج'), blank=True)
    tuition_fee = models.DecimalField(_('الرسوم الدراسية'), max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    currency = models.CharField(_('العملة'), max_length=5, default='SAR')
    scholarship_available = models.BooleanField(_('منح متاحة'), default=False)
    status = models.CharField(_('الحالة'), max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    is_active = models.BooleanField(_('نشط'), default=True)
    is_featured = models.BooleanField(_('مميز'), default=False)
    application_deadline = models.DateField(_('آخر موعد للتقديم'), null=True, blank=True)
    start_date = models.DateField(_('تاريخ البدء'), null=True, blank=True)
    max_students = models.PositiveIntegerField(_('الحد الأقصى للطلاب'), default=0, help_text='0 = غير محدود')
    cover_image = models.ImageField(_('صورة الغلاف'), upload_to='programs/covers/', blank=True, null=True)
    brochure = models.FileField(_('البروشور'), upload_to='programs/brochures/', blank=True, null=True)
    edx_course_keys = models.JSONField(_('مقررات edX المرتبطة'), default=list, blank=True)
    views_count = models.PositiveIntegerField(_('عدد المشاهدات'), default=0)
    applications_count = models.PositiveIntegerField(_('عدد الطلبات الإجمالي'), default=0)
    accepted_count = models.PositiveIntegerField(_('عدد المقبولين'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_programs', verbose_name=_('أنشأه')
    )

    class Meta:
        verbose_name = _('برنامج أكاديمي')
        verbose_name_plural = _('البرامج الأكاديمية')
        ordering = ['-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['provider', 'degree_level']),
            models.Index(fields=['field_of_study']),
        ]

    def __str__(self):
        return f"{self.title} — {self.provider.name}"

    def increment_views(self):
        """زيادة عدد المشاهدات بشكل آمن."""
        self.views_count = models.F('views_count') + 1
        self.save(update_fields=['views_count'])
        self.refresh_from_db(fields=['views_count'])

    @property
    def is_open_for_applications(self):
        from django.utils import timezone
        if not self.is_active or self.status != 'active':
            return False
        if self.application_deadline and self.application_deadline < timezone.now().date():
            return False
        if self.max_students > 0:
            if self.accepted_count >= self.max_students:
                return False
        return True


import uuid
import os
from django.core.validators import FileExtensionValidator

def get_upload_path(instance, filename):
    """توليد مسار عشوائي ومحمي للملفات المرفوعة لحماية الخصوصية."""
    import hashlib
    # استخدام هاش لاسم المستخدم بدلاً من الاسم الصريح لزيادة الخصوصية
    user_hash = hashlib.md5(instance.applicant.username.encode()).hexdigest()[:12]
    ext = filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('applications', user_hash, unique_filename)

class ProgramApplication(models.Model):
    """طلب تقديم لبرنامج أكاديمي."""

    STATUS_CHOICES = [
        ('submitted', _('مقدم')),
        ('under_review', _('قيد المراجعة')),
        ('accepted', _('مقبول')),
        ('rejected', _('مرفوض')),
        ('waitlisted', _('قائمة الانتظار')),
        ('withdrawn', _('منسحب')),
    ]

    program = models.ForeignKey(
        AcademicProgram, on_delete=models.CASCADE,
        related_name='applications', verbose_name=_('البرنامج')
    )
    applicant = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='program_applications', verbose_name=_('المتقدم')
    )
    status = models.CharField(_('الحالة'), max_length=20, choices=STATUS_CHOICES, default='submitted', db_index=True)
    referral_code = models.CharField(_('كود الإحالة المستخدم'), max_length=50, blank=True)
    full_name = models.CharField(_('الاسم الكامل'), max_length=200)
    email = models.EmailField(_('البريد الإلكتروني'))
    phone = models.CharField(_('الهاتف'), max_length=20)
    nationality = models.CharField(_('الجنسية'), max_length=100, blank=True)
    date_of_birth = models.DateField(_('تاريخ الميلاد'), null=True, blank=True)
    highest_qualification = models.CharField(_('أعلى مؤهل'), max_length=200, blank=True)
    graduation_year = models.PositiveSmallIntegerField(_('سنة التخرج'), null=True, blank=True)
    gpa = models.DecimalField(
        _('المعدل التراكمي'), max_digits=4, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)] # دعم مقياس 4 و 5
    )
    work_experience_years = models.PositiveSmallIntegerField(_('سنوات الخبرة'), default=0)
    personal_statement = models.TextField(_('الخطة الشخصية'), blank=True)
    cv = models.FileField(
        _('السيرة الذاتية'), upload_to=get_upload_path, blank=True, null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    transcripts = models.FileField(
        _('كشف الدرجات'), upload_to=get_upload_path, blank=True, null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'png'])]
    )
    additional_docs = models.FileField(
        _('مستندات إضافية'), upload_to=get_upload_path, blank=True, null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'png', 'zip'])]
    )
    reviewer_notes = models.TextField(_('ملاحظات المراجع'), blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_applications', verbose_name=_('راجعه')
    )
    reviewed_at = models.DateTimeField(_('تاريخ المراجعة'), null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('طلب تقديم')
        verbose_name_plural = _('طلبات التقديم')
        ordering = ['-submitted_at']
        unique_together = [['program', 'applicant']]
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['program', 'status']),
            models.Index(fields=['email']),
            models.Index(fields=['full_name']),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.program.title}"


class UserReferral(models.Model):
    """تتبع أكواد الإحالة والمكافآت لكل مستخدم."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referral_info')
    code = models.CharField(_('كود الإحالة الخاص'), max_length=20, unique=True, db_index=True)
    points = models.PositiveIntegerField(_('النقاط المكتسبة'), default=0)
    total_referred = models.PositiveIntegerField(_('إجمالي المستخدمين الذين تمت دعوتهم'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.code})"

    @classmethod
    def generate_code_for_user(cls, user):
        import uuid
        from django.db import IntegrityError
        # المحاولة حتى نجد كوداً فريداً غير مستخدم
        while True:
            code = str(uuid.uuid4())[:10].upper()
            try:
                # نستخدم get_or_create مع معالجة التضارب بشكل مباشر لضمان الذرية
                return cls.objects.get_or_create(user=user, defaults={'code': code})
            except IntegrityError:
                # إذا وجد مستخدم آخر بنفس الكود في هذه اللحظة، نعيد المحاولة
                if not cls.objects.filter(user=user).exists():
                    continue
                return cls.objects.get(user=user), False

class ReferralReward(models.Model):
    """سجل المكافآت الممنوحة لمنع التكرار وتتبع النزاهة عند التقديم للبرامج."""
    referrer = models.ForeignKey(UserReferral, on_delete=models.CASCADE, related_name='rewards')
    application = models.OneToOneField(ProgramApplication, on_delete=models.CASCADE, related_name='referral_reward')
    points_awarded = models.PositiveIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('مكافأة إحالة برنامج')
        verbose_name_plural = _('مكافآت إحالة البرامج')

class CourseReferralReward(models.Model):
    """مكافأة الإحالة عند شراء كورس مدفوع."""
    referrer = models.ForeignKey(UserReferral, on_delete=models.CASCADE, related_name='course_rewards')
    order = models.OneToOneField('learnnov_payments.Order', on_delete=models.CASCADE, related_name='referral_reward')
    points_awarded = models.PositiveIntegerField(_('النقاط الممنوحة'), default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('مكافأة شراء كورس')
        verbose_name_plural = _('مكافآت شراء الكورسات')


class ApplicationStatusHistory(models.Model):
    """سجل تدقيق لتغييرات حالة طلب التقديم (Audit Trail)."""
    application = models.ForeignKey(ProgramApplication, on_delete=models.CASCADE, related_name='status_history')
    old_status  = models.CharField(max_length=20, choices=ProgramApplication.STATUS_CHOICES)
    new_status  = models.CharField(max_length=20, choices=ProgramApplication.STATUS_CHOICES)
    changed_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes       = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('سجل حالة الطلب')
        verbose_name_plural = _('سجلات حالات الطلبات')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.application.id}: {self.old_status} -> {self.new_status}"
