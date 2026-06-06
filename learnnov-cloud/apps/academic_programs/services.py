"""
Service layer for academic_programs app.
Provides business logic separate from viewsets for easier testing and reuse.
"""
from django.db import transaction
from .models import Specialization, SpecializationEnrollment, ProgramApplication
from django.shortcuts import get_object_or_404

def enroll_user_in_specialization(user, specialization_slug):
    """Enroll a user in a specialization and auto‑create program applications.
    Returns the SpecializationEnrollment instance.
    """
    specialization = get_object_or_404(Specialization, slug=specialization_slug, is_active=True)
    # Ensure enrollment exists
    enrollment, created = SpecializationEnrollment.objects.get_or_create(
        user=user,
        specialization=specialization,
        defaults={'status': 'enrolled'}
    )
    # Create or get program applications for each course in the specialization
    courses = specialization.courses.all()
    for course in courses:
        ProgramApplication.objects.get_or_create(
            program=course,
            applicant=user,
            defaults={
                'status': 'enrolled',
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email or 'student@learnnov.org',
                'phone': '0500000000',
            }
        )
    return enrollment
