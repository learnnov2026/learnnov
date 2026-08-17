from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from django.db.models import Count
from .models import ProgramProvider, FieldOfStudy, AcademicProgram, ProgramApplication, ApplicationStatusHistory

# ── Field Of Study ──────────────────────────────────────────────────────────
@admin.register(FieldOfStudy)
class FieldOfStudyAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_en', 'parent', 'is_active', 'sort_order', 'programs_count')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'name_en')
    prepopulated_fields = {'slug': ('name_en',)}
    ordering = ('sort_order', 'name')

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(programs_count=Count('programs'))

    @admin.display(description=_('عدد البرامج'), ordering='programs_count')
    def programs_count(self, obj):
        return obj.programs_count

# ── Program Provider ────────────────────────────────────────────────────────
@admin.register(ProgramProvider)
class ProgramProviderAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'provider_type', 'country', 'accreditation',
        'is_verified', 'is_active', 'logo_preview', 'programs_count'
    )
    list_filter = ('provider_type', 'country', 'accreditation', 'is_verified', 'is_active')
    search_fields = ('name', 'name_en', 'country', 'contact_email')
    prepopulated_fields = {'slug': ('name_en',)}
    readonly_fields = ('created_at', 'updated_at', 'logo_preview')
    list_editable = ('is_verified', 'is_active')

    fieldsets = (
        (_('المعلومات الأساسية'), {'fields': ('name', 'name_en', 'slug', 'provider_type', 'accreditation')}),
        (_('الموقع'), {'fields': ('country', 'city', 'website')}),
        (_('الشعار والوصف'), {'fields': ('logo', 'logo_preview', 'description')}),
        (_('التواصل'), {'fields': ('contact_email', 'contact_phone')}),
        (_('الحالة'), {'fields': ('is_active', 'is_verified')}),
        (_('التواريخ'), {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request).annotate(programs_count=Count('programs'))
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'university') and request.user.university and request.user.university.provider:
            return qs.filter(id=request.user.university.provider_id)
        return qs.none()

    @admin.display(description=_('الشعار'))
    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="height:40px;"/>', obj.logo.url)
        return '—'

    @admin.display(description=_('البرامج'), ordering='programs_count')
    def programs_count(self, obj):
        return obj.programs_count

# ── Academic Program ────────────────────────────────────────────────────────
class ProgramApplicationInline(admin.TabularInline):
    model = ProgramApplication
    extra = 0
    fields = ('applicant', 'status', 'submitted_at')
    readonly_fields = ('applicant', 'submitted_at')
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

@admin.register(AcademicProgram)
class AcademicProgramAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'provider', 'degree_level', 'status', 'is_featured', 
        'is_active', 'views_count', 'applications_count'
    )
    list_filter = ('status', 'degree_level', 'is_featured', 'is_active', 'provider')
    search_fields = ('title', 'title_en', 'provider__name')
    prepopulated_fields = {'slug': ('title_en',)}
    readonly_fields = ('views_count', 'applications_count', 'created_at', 'updated_at', 'cover_preview')
    autocomplete_fields = ['provider', 'field_of_study']
    inlines = [ProgramApplicationInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request).select_related('provider', 'field_of_study')
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'university') and request.user.university and request.user.university.provider:
            return qs.filter(provider=request.user.university.provider)
        return qs.none()

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    @admin.display(description=_('صورة الغلاف'))
    def cover_preview(self, obj):
        if obj.cover_image:
            return format_html('<img src="{}" style="max-width:200px;"/>', obj.cover_image.url)
        return '—'

# ── Program Application ─────────────────────────────────────────────────────
class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('old_status', 'new_status', 'changed_by', 'created_at', 'notes')
    can_delete = False
    def has_add_permission(self, request, obj=None): return False

@admin.register(ProgramApplication)
class ProgramApplicationAdmin(admin.ModelAdmin):
    list_display = ('applicant', 'program', 'status', 'submitted_at', 'referral_code')
    list_filter = ('status', 'submitted_at', 'program__provider')
    search_fields = ('applicant__username', 'applicant__email', 'program__title')
    readonly_fields = ('applicant', 'program', 'submitted_at', 'referral_code')
    inlines = [ApplicationStatusHistoryInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request).select_related('applicant', 'program', 'program__provider')
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'university') and request.user.university and request.user.university.provider:
            return qs.filter(program__provider=request.user.university.provider)
        return qs.none()

    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            from django.utils import timezone
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)
