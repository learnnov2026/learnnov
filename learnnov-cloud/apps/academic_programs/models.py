"""
academic_programs — Models (standalone, no Open edX dependency).
"""
import os
import uuid
import hashlib

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.utils.translation import gettext_lazy as _
from django_cryptography.fields import encrypt
from apps.core.validators import validate_file_type, validate_file_infection

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
    country = models.CharField(_('الدولة'), max_length=100, default='Saudi Arabia')
    city = models.CharField(_('المدينة'), max_length=100, blank=True)
    logo = models.ImageField(_('الشعار'), upload_to='providers/logos/', blank=True, null=True, validators=[FileExtensionValidator(['png', 'jpg', 'jpeg']), validate_file_type, validate_file_infection])
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
    """مجال دراسي."""
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
    """برنامج أكاديمي."""
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

    provider = models.ForeignKey(ProgramProvider, on_delete=models.CASCADE, related_name='programs', verbose_name=_('المؤسسة'))
    field_of_study = models.ForeignKey(FieldOfStudy, on_delete=models.SET_NULL, null=True, related_name='programs', verbose_name=_('المجال الدراسي'))
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
    cover_image = models.ImageField(_('صورة الغلاف'), upload_to='programs/covers/', blank=True, null=True, validators=[FileExtensionValidator(['png', 'jpg', 'jpeg']), validate_file_type, validate_file_infection])
    brochure = models.FileField(_('البروشور'), upload_to='programs/brochures/', blank=True, null=True, validators=[FileExtensionValidator(['pdf', 'zip']), validate_file_type, validate_file_infection])
    views_count = models.PositiveIntegerField(_('عدد المشاهدات'), default=0)
    applications_count = models.PositiveIntegerField(_('عدد الطلبات'), default=0)
    accepted_count = models.PositiveIntegerField(_('عدد المقبولين'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_programs')

    class Meta:
        verbose_name = _('برنامج أكاديمي')
        verbose_name_plural = _('البرامج الأكاديمية')
        ordering = ['-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['provider', 'degree_level']),
        ]

    def __str__(self):
        return f"{self.title} — {self.provider.name}"

    def increment_views(self):
        self.views_count = models.F('views_count') + 1
        self.save(update_fields=['views_count'])

    @property
    def is_open_for_applications(self):
        from django.utils import timezone
        if not self.is_active or self.status != 'active':
            return False
        if self.application_deadline and self.application_deadline < timezone.now().date():
            return False
        if self.max_students > 0 and self.accepted_count >= self.max_students:
            return False
        return True


def get_upload_path(instance, filename):
    user_hash = hashlib.sha256(instance.applicant.username.encode()).hexdigest()[:12]
    ext = filename.split('.')[-1]
    return os.path.join('applications', user_hash, f"{uuid.uuid4()}.{ext}")


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

    program = models.ForeignKey(AcademicProgram, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='program_applications')
    status = models.CharField(_('الحالة'), max_length=20, choices=STATUS_CHOICES, default='submitted', db_index=True)
    referral_code = models.CharField(_('كود الإحالة'), max_length=50, blank=True)
    full_name = models.CharField(_('الاسم الكامل'), max_length=200)
    email = models.EmailField(_('البريد الإلكتروني'))
    phone = models.CharField(_('الهاتف'), max_length=20)
    nationality = models.CharField(_('الجنسية'), max_length=100, blank=True)
    national_id = encrypt(models.CharField(_('الهوية الوطنية'), max_length=50, blank=True))
    date_of_birth = models.DateField(_('تاريخ الميلاد'), null=True, blank=True)
    highest_qualification = models.CharField(_('أعلى مؤهل'), max_length=200, blank=True)
    graduation_year = models.PositiveSmallIntegerField(_('سنة التخرج'), null=True, blank=True)
    gpa = models.DecimalField(_('المعدل التراكمي'), max_digits=4, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(5)])
    work_experience_years = models.PositiveSmallIntegerField(_('سنوات الخبرة'), default=0)
    personal_statement = models.TextField(_('الخطة الشخصية'), blank=True)
    cv = models.FileField(_('السيرة الذاتية'), upload_to=get_upload_path, blank=True, null=True, validators=[FileExtensionValidator(['pdf', 'doc', 'docx']), validate_file_type, validate_file_infection])
    transcripts = models.FileField(_('كشف الدرجات'), upload_to=get_upload_path, blank=True, null=True, validators=[FileExtensionValidator(['pdf', 'jpg', 'png']), validate_file_type, validate_file_infection])
    additional_docs = models.FileField(_('مستندات إضافية'), upload_to=get_upload_path, blank=True, null=True, validators=[FileExtensionValidator(['pdf', 'jpg', 'png', 'zip', 'doc', 'docx']), validate_file_type, validate_file_infection])
    reviewer_notes = models.TextField(_('ملاحظات المراجع'), blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('طلب تقديم')
        verbose_name_plural = _('طلبات التقديم')
        ordering = ['-submitted_at']
        unique_together = [['program', 'applicant']]

    def __str__(self):
        return f"{self.full_name} - {self.program.title}"


class UserReferral(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referral_info')
    code = models.CharField(max_length=20, unique=True, db_index=True)
    points = models.PositiveIntegerField(default=0)
    total_referred = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.code})"

    @classmethod
    def generate_code_for_user(cls, user):
        from django.db import IntegrityError
        while True:
            code = str(uuid.uuid4())[:10].upper()
            try:
                return cls.objects.get_or_create(user=user, defaults={'code': code})
            except IntegrityError:
                if not cls.objects.filter(user=user).exists():
                    continue
                return cls.objects.get(user=user), False


class ReferralReward(models.Model):
    referrer = models.ForeignKey(UserReferral, on_delete=models.CASCADE, related_name='rewards')
    application = models.OneToOneField(ProgramApplication, on_delete=models.CASCADE, related_name='referral_reward')
    points_awarded = models.PositiveIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('مكافأة إحالة')
        verbose_name_plural = _('مكافآت الإحالة')


class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(ProgramApplication, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, choices=ProgramApplication.STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=ProgramApplication.STATUS_CHOICES)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('سجل حالة الطلب')
        verbose_name_plural = _('سجلات حالات الطلبات')
        ordering = ['-created_at']


class ProgramModule(models.Model):
    """وحدة دراسية (فصل/قسم) داخل المقرر."""
    program = models.ForeignKey(AcademicProgram, on_delete=models.CASCADE, related_name='modules', verbose_name=_('المقرر'))
    title = models.CharField(_('عنوان الوحدة'), max_length=255)
    description = models.TextField(_('وصف الوحدة'), blank=True)
    order = models.PositiveSmallIntegerField(_('الترتيب'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('وحدة دراسية')
        verbose_name_plural = _('الوحدات الدراسية')
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.program.title} - {self.title}"


def lesson_media_path(instance, filename):
    return os.path.join('lessons', str(instance.module.program.id), str(instance.module.id), filename)

class ProgramLesson(models.Model):
    """درس تفصيلي داخل الوحدة الدراسية."""
    LESSON_TYPES = [
        ('video', _('فيديو')),
        ('pdf', _('ملف PDF')),
        ('text', _('مقال / نص')),
        ('quiz', _('اختبار قصير')),
    ]

    module = models.ForeignKey(ProgramModule, on_delete=models.CASCADE, related_name='lessons', verbose_name=_('الوحدة الدراسية'))
    title = models.CharField(_('عنوان الدرس'), max_length=255)
    lesson_type = models.CharField(_('نوع الدرس'), max_length=20, choices=LESSON_TYPES, default='video')
    content = models.TextField(_('محتوى نصي'), blank=True, help_text=_('يستخدم إذا كان الدرس من نوع نص/مقال'))
    media_file = models.FileField(_('ملف الدرس'), upload_to=lesson_media_path, blank=True, null=True, help_text=_('الفيديو أو ملف الـ PDF'), validators=[FileExtensionValidator(['pdf', 'mp4', 'webm', 'mp3']), validate_file_type, validate_file_infection])
    duration_minutes = models.PositiveSmallIntegerField(_('المدة التقريبية بالدقائق'), default=0)
    order = models.PositiveSmallIntegerField(_('الترتيب'), default=0)
    is_preview = models.BooleanField(_('معاينة مجانية'), default=False, help_text=_('هل يمكن لغير المشتركين رؤية هذا الدرس؟'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('درس')
        verbose_name_plural = _('الدروس')
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.title
