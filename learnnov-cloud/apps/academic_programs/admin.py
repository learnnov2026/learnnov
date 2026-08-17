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
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.shortcuts import render, redirect
from django.urls import path
from apps.academic_programs.models import AcademicProgram, ProgramApplication
from django.contrib import messages

def enroll_users_in_program(modeladmin, request, queryset):
    # This is an intermediate page
    if 'apply' in request.POST:
        program_id = request.POST.get('program')
        if not program_id:
            messages.error(request, 'يجب اختيار كورس')
            return redirect(request.get_full_path())
            
        program = AcademicProgram.objects.get(id=program_id)
        count = 0
        for user in queryset:
            # Create application and auto-accept
            app, created = ProgramApplication.objects.get_or_create(
                applicant=user,
                program=program,
                defaults={
                    'full_name': user.get_full_name() or user.username,
                    'email': user.email,
                    'status': 'accepted',
                    'phone': '0000000000' # Required by model, dummy if missing
                }
            )
            if not created and app.status != 'accepted':
                app.status = 'accepted'
                app.save()
            count += 1
            
        messages.success(request, f'تم تسجيل {count} طالب بنجاح في كورس {program.title}')
        return redirect(request.get_full_path())
        
    programs = AcademicProgram.objects.all()
    return render(request, 'admin/enroll_users_intermediate.html', context={
        'users': queryset,
        'programs': programs,
        'action_checkbox_name': admin.helpers.ACTION_CHECKBOX_NAME
    })

enroll_users_in_program.short_description = "تسجيل الطلاب المحددين في كورس"

# Check if User is already registered to unregister it safely
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

class CustomUserAdmin(UserAdmin):
    actions = [enroll_users_in_program]

admin.site.register(User, CustomUserAdmin)

