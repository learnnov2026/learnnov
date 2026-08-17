import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def seed_data():
    from apps.academic_programs.models import ProgramProvider, AcademicProgram, ProgramApplication
    from apps.learnnov_exams.models import MockExam

    print("Starting data seeding...")

    # 1. Create Users (Students)
    students_data = [
        ("ahmed_ali", "ahmed@example.com", "أحمد", "علي"),
        ("sara_khalid", "sara@example.com", "سارة", "خالد"),
        ("omar_farooq", "omar@example.com", "عمر", "فاروق"),
    ]
    
    students = []
    for username, email, first, last in students_data:
        user, created = User.objects.get_or_create(username=username, defaults={
            'email': email,
            'first_name': first,
            'last_name': last,
        })
        if created:
            user.set_password("learnnov123")
            user.save()
        students.append(user)
        print(f"User {username} ready.")

    # 2. Create Providers
    provider, _ = ProgramProvider.objects.get_or_create(
        slug="king-saud-univ",
        defaults={
            "name": "جامعة الملك سعود",
            "name_en": "King Saud University",
            "description": "إحدى أعرق الجامعات في المملكة."
        }
    )

    # 3. Create Academic Programs
    programs_data = [
        ("computer-science-101", "مقدمة في علوم الحاسب", 1500.00),
        ("data-science-bootcamp", "المعسكر المكثف لعلوم البيانات", 3500.00),
        ("cyber-security-basics", "أساسيات الأمن السيبراني", 2000.00),
    ]

    programs = []
    for slug, title, fee in programs_data:
        prog, _ = AcademicProgram.objects.get_or_create(
            slug=slug,
            defaults={
                "title": title,
                "provider": provider,
                "description": f"وصف تجريبي لبرنامج {title}",
                "tuition_fee": fee,
                "is_active": True
            }
        )
        programs.append(prog)
        print("Program ready.")

    # 4. Create Applications (Enrollments)
    # Ahmed enrolled in CS 101
    ProgramApplication.objects.get_or_create(
        applicant=students[0],
        program=programs[0],
        defaults={
            "status": "enrolled",
        }
    )
    
    # Sara enrolled in Data Science
    ProgramApplication.objects.get_or_create(
        applicant=students[1],
        program=programs[1],
        defaults={
            "status": "enrolled",
        }
    )
    
    # Omar applied for Cyber Security (Pending)
    ProgramApplication.objects.get_or_create(
        applicant=students[2],
        program=programs[2],
        defaults={
            "status": "pending",
        }
    )
    
    print("Applications ready.")

    # 5. Create a Mock Exam
    exam, _ = MockExam.objects.get_or_create(
        course_id=programs[0].slug,
        defaults={
            "title": "اختبار منتصف الفصل - علوم الحاسب",
            "time_limit_minutes": 60,
            "is_active": True
        }
    )
    print("Exam created.")
    
    print("Seed complete!")

if __name__ == '__main__':
    seed_data()
