from django.contrib import admin
from .models import (
    ProgramProvider, FieldOfStudy, AcademicProgram,
    ProgramApplication, UserReferral, ApplicationStatusHistory,
    ProgramModule, ProgramLesson
)

class ProgramLessonInline(admin.TabularInline):
    model = ProgramLesson
    extra = 1

class ProgramModuleInline(admin.StackedInline):
    model = ProgramModule
    extra = 1

@admin.register(ProgramProvider)
class ProgramProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider_type', 'country', 'is_active', 'is_verified']
    list_filter = ['provider_type', 'is_active', 'is_verified', 'accreditation']
    search_fields = ['name', 'name_en']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(FieldOfStudy)
class FieldOfStudyAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'sort_order', 'is_active']
    list_filter = ['is_active']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(AcademicProgram)
class AcademicProgramAdmin(admin.ModelAdmin):
    list_display = ['title', 'provider', 'degree_level', 'status', 'is_featured', 'tuition_fee', 'applications_count']
    list_filter = ['status', 'degree_level', 'study_mode', 'is_featured', 'provider']
    search_fields = ['title', 'title_en']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['views_count', 'applications_count', 'accepted_count']
    inlines = [ProgramModuleInline]

@admin.register(ProgramModule)
class ProgramModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'program', 'order', 'created_at']
    list_filter = ['program']
    search_fields = ['title']
    inlines = [ProgramLessonInline]


@admin.register(ProgramApplication)
class ProgramApplicationAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'program', 'status', 'email', 'submitted_at']
    list_filter = ['status', 'program__provider']
    search_fields = ['full_name', 'email']
    readonly_fields = ['submitted_at']


@admin.register(UserReferral)
class UserReferralAdmin(admin.ModelAdmin):
    list_display = ['user', 'code', 'points', 'total_referred']
    search_fields = ['user__username', 'code']


@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['application', 'old_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['new_status']
