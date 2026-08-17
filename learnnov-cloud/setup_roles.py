import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def setup_roles():
    print("Setting up system roles and permissions...")

    # Define the groups
    managers_group, _ = Group.objects.get_or_create(name='Managers')
    instructors_group, _ = Group.objects.get_or_create(name='Instructors')
    accountants_group, _ = Group.objects.get_or_create(name='Accountants')
    students_group, _ = Group.objects.get_or_create(name='Students')

    # Fetch all permissions
    all_perms = Permission.objects.all()

    # Define app labels for different roles
    manager_apps = [
        'academic_programs', 'course_discussions', 'learnnov_certificates',
        'learnnov_exams', 'learnnov_payments', 'auth', 'users', 'ai_assistant'
    ]
    
    instructor_apps = [
        'academic_programs', 'course_discussions', 'learnnov_exams', 'learnnov_certificates'
    ]

    accountant_apps = [
        'learnnov_payments'
    ]

    # Assign Manager Permissions (Almost everything except admin/sessions)
    manager_perms = all_perms.filter(content_type__app_label__in=manager_apps)
    managers_group.permissions.set(manager_perms)

    # Assign Instructor Permissions
    instructor_perms = all_perms.filter(content_type__app_label__in=instructor_apps)
    instructors_group.permissions.set(instructor_perms)

    # Assign Accountant Permissions
    # They should have full access to payments
    accountant_perms = all_perms.filter(content_type__app_label__in=accountant_apps)
    
    # Also give accountants 'view' access to academic_programs
    accountant_view_perms = all_perms.filter(
        content_type__app_label='academic_programs',
        codename__startswith='view_'
    )
    accountants_group.permissions.set(list(accountant_perms) + list(accountant_view_perms))

    # Students don't need admin permissions, so their group remains empty of admin perms.

    print("Roles created successfully!")
    print("- Managers")
    print("- Instructors")
    print("- Accountants")
    print("- Students")

if __name__ == '__main__':
    setup_roles()
