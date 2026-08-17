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
