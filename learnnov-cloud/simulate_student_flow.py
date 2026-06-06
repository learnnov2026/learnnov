import os
import sys
import django
import uuid
from django.utils import timezone

# Configure console encoding to support emojis
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.academic_programs.models import AcademicProgram, Specialization, SpecializationCourse, SpecializationEnrollment, ProgramLesson, ProgramModule
from apps.learnnov_payments.models import SubscriptionPlan, UserSubscription
from apps.learnnov_certificates.models import GeneratedCertificate, SpecializationCertificate
from apps.core.permissions import has_active_enrollment

User = get_user_model()

def run_simulation():
    print("=" * 80)
    print("🎓 STARTING STUDENT FLOW SIMULATION (COURSERA MODEL)")
    print("=" * 80)

    # 1. Create a fresh test student
    username = f"student_{uuid.uuid4().hex[:6]}"
    email = f"{username}@learnnov.edu.sa"
    student = User.objects.create_user(username=username, email=email, password="password123", first_name="عبدالرحمن", last_name="الغامدي")
    print(f"[✓] Created Test Student: {username} ({student.get_full_name()})")

    # 2. Get the Specialization and its Courses
    spec_slug = "ai-data-engineering-specialization"
    try:
        spec = Specialization.objects.get(slug=spec_slug)
        print(f"[✓] Found Specialization Track: '{spec.title}'")
    except Specialization.DoesNotExist:
        print(f"[x] Error: Specialization {spec_slug} not found. Please run seed_data first!")
        return

    courses = list(spec.courses.all().order_by('specializationcourse__order'))
    print(f"    Courses in this track ({len(courses)} courses):")
    for idx, c in enumerate(courses):
        print(f"      {idx+1}. {c.title} ({c.slug})")

    # 3. Choose a lesson from the first course
    first_course = courses[0]
    module = ProgramModule.objects.filter(program=first_course).first()
    if not module:
        module = ProgramModule.objects.create(program=first_course, title="Module 1", order=1)
    lesson = ProgramLesson.objects.filter(module=module, is_preview=False).first()
    if not lesson:
        lesson = ProgramLesson.objects.create(module=module, title="Introduction to Neural Networks", is_preview=False, content="Secret Deep Learning Formula")

    print(f"\n[+] Testing content access for lock state:")
    print(f"    Course: '{first_course.title}'")
    print(f"    Lesson: '{lesson.title}' (is_preview={lesson.is_preview})")

    # Verify if student has access
    has_access = has_active_enrollment(student, first_course)
    print(f"    -> Access status before enrolling or subscribing: {'UNLOCKED (✓)' if has_access else 'LOCKED (🔒)'}")

    # 4. Simulate active subscription
    print(f"\n[+] Simulating Stripe Subscription activation...")
    plan = SubscriptionPlan.objects.filter(slug='monthly').first()
    if not plan:
        plan = SubscriptionPlan.objects.create(name="Premium Monthly", slug="monthly", price=199.00, billing_cycle="monthly")
    
    # Activate subscription
    subscription = UserSubscription.objects.create(
        user=student,
        plan=plan,
        status="active",
        current_period_start=timezone.now(),
        current_period_end=timezone.now() + timezone.timedelta(days=30),
        cancel_at_period_end=False
    )
    print(f"    [✓] Subscription activated successfully! Plan: {plan.name}")

    # Verify if student has access now via subscription bypass
    has_access_after_sub = has_active_enrollment(student, first_course)
    print(f"    -> Access status after subscribing: {'UNLOCKED (✓)' if has_access_after_sub else 'LOCKED (🔒)'}")

    # 5. Enroll student in the Specialization track
    print(f"\n[+] Enrolling student in Specialization Track...")
    enrollment, created = SpecializationEnrollment.objects.get_or_create(
        user=student,
        specialization=spec,
        defaults={'status': 'enrolled'}
    )
    # Also enroll in all constituent courses
    from apps.academic_programs.models import ProgramApplication
    for course in courses:
        ProgramApplication.objects.get_or_create(
            program=course,
            applicant=student,
            defaults={'status': 'enrolled', 'full_name': student.get_full_name()}
        )
    print(f"    [✓] Student successfully enrolled in '{spec.title}' and all its constituent courses.")

    # 6. Simulate course completions & certificates issuance
    print(f"\n[+] Simulating completions of all courses in specialization sequence:")
    for idx, course in enumerate(courses):
        # 6a. Generate course certificate
        cert = GeneratedCertificate.objects.create(
            user=student,
            course_id=course.slug,
            course_name=course.title,
            grade="95",
            status="downloadable",
            verify_uuid=str(uuid.uuid4())
        )
        print(f"    -> Completed Course {idx+1}/{len(courses)}: '{course.title}'")
        print(f"       Course Certificate Issued. UUID: {cert.verify_uuid}")

        # 6b. Check if specialization certificate is triggered
        # (This replicates GenerateCertificateView.post logic for triggering milestone cert)
        all_completed = True
        for c in spec.courses.all():
            completed = GeneratedCertificate.objects.filter(
                user=student,
                course_id=c.slug,
                status='downloadable'
            ).exists()
            if not completed:
                all_completed = False
                break
        
        if all_completed:
            spec_cert, spec_created = SpecializationCertificate.objects.get_or_create(
                user=student,
                specialization=spec,
                defaults={
                    'verify_uuid': uuid.uuid4().hex,
                    'status': 'downloadable'
                }
            )
            print(f"\n🏆 CONGRATULATIONS! ALL COURSES COMPLETED!")
            print(f"🏆 Automatic Gold Specialization Certificate Generated successfully!")
            print(f"   Specialization: '{spec.title}'")
            print(f"   Specialization Certificate UUID: {spec_cert.verify_uuid}")
            print(f"   Verify URL: /certificates?verify_uuid={spec_cert.verify_uuid}")

    print("=" * 80)
    print("🎓 SIMULATION COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == '__main__':
    run_simulation()
