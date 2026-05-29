import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.academic_programs.models import FieldOfStudy, ProgramProvider, AcademicProgram, ProgramModule, ProgramLesson, ProgramApplication
from apps.learnnov_exams.models import MockExam, Question, Choice
from apps.course_discussions.models import DiscussionThread, DiscussionPost
from apps.learnnov_certificates.models import GeneratedCertificate
from apps.learnnov_payments.models import DiscountCode, Order, OrderStatus, PaymentGateway

class Command(BaseCommand):
    help = "Populate the database with dynamic realistic seed data for the LearnNov platform"

    def handle(self, *args, **options):
        User = get_user_model()
        self.stdout.write("Seeding database...")

        # 1. Users
        # Instructor (dr_ali / learnnov2026)
        dr_ali, created = User.objects.get_or_create(
            username="dr_ali",
            defaults={
                "email": "dr.ali@learnnov.edu.sa",
                "first_name": "د. علي",
                "last_name": "البرهومي",
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if created or not dr_ali.check_password("learnnov2026"):
            dr_ali.set_password("learnnov2026")
            dr_ali.save()
            self.stdout.write("Created/Updated user: dr_ali")

        # Student (student_demo / learnnov2026)
        student, created = User.objects.get_or_create(
            username="student_demo",
            defaults={
                "email": "student@learnnov.edu.sa",
                "first_name": "طالب",
                "last_name": "تجريبي",
                "is_staff": False,
                "is_superuser": False,
            }
        )
        if created or not student.check_password("learnnov2026"):
            student.set_password("learnnov2026")
            student.save()
            self.stdout.write("Created/Updated user: student_demo")

        # 2. Fields of Study
        cs_field, _ = FieldOfStudy.objects.get_or_create(
            slug="computer-science",
            defaults={
                "name": "علوم الحاسب والمعلومات",
                "name_en": "Computer Science",
                "icon": "computer",
            }
        )
        cyber_field, _ = FieldOfStudy.objects.get_or_create(
            slug="cybersecurity",
            defaults={
                "name": "الأمن السيبراني والمطابقة",
                "name_en": "Cybersecurity & Compliance",
                "icon": "shield",
            }
        )

        # 3. Provider
        ksu, _ = ProgramProvider.objects.get_or_create(
            slug="ksu",
            defaults={
                "name": "جامعة الملك سعود",
                "name_en": "King Saud University",
                "provider_type": "university",
                "country": "SA",
                "city": "الرياض",
                "description": "جامعة بحثية رائدة في المملكة العربية السعودية تقدم برامج نوعية ممتازة.",
                "accreditation": "NCAAA",
                "is_verified": True,
            }
        )

        # 4. Programs (Courses)
        ai_program, _ = AcademicProgram.objects.get_or_create(
            slug="artificial-intelligence",
            defaults={
                "title": "الذكاء الاصطناعي وهندسة البيانات",
                "title_en": "AI and Data Engineering",
                "provider": ksu,
                "field_of_study": cs_field,
                "degree_level": "master",
                "study_mode": "hybrid",
                "language": "ar",
                "duration_months": 12,
                "credit_hours": 36,
                "tuition_fee": 12000.00,
                "currency": "SAR",
                "scholarship_available": True,
                "is_featured": True,
                "description": "برنامج مكثف يؤهلك لتصميم وتطوير أنظمة الذكاء الاصطناعي الحديثة ومعالجة البيانات الضخمة.",
                "objectives": "تمكين الطلاب من بناء خوارزميات التعلم العميق وتحليل البيانات الكبيرة.",
                "requirements": "شهادة البكالوريوس في تخصص حاسوبي مع معدل لا يقل عن جيد جداً.",
                "curriculum_overview": "يغطي البرنامج مقدمة في الذكاء الاصطناعي، الشبكات العصبية، والبيانات الضخمة.",
                "is_active": True,
                "status": "active",
                "max_students": 50,
            }
        )

        cyber_program, _ = AcademicProgram.objects.get_or_create(
            slug="cybersecurity-governance",
            defaults={
                "title": "ماجستير حوكمة الأمن السيبراني",
                "title_en": "MSc in Cybersecurity Governance",
                "provider": ksu,
                "field_of_study": cyber_field,
                "degree_level": "master",
                "study_mode": "online",
                "language": "ar",
                "duration_months": 18,
                "credit_hours": 42,
                "tuition_fee": 15000.00,
                "currency": "SAR",
                "scholarship_available": False,
                "is_featured": True,
                "description": "برنامج متخصص في إدارة المخاطر والمطابقة الأمنية وحوكمة الأنظمة الرقمية في المؤسسات.",
                "is_active": True,
                "status": "active",
                "max_students": 30,
            }
        )

        fullstack_program, _ = AcademicProgram.objects.get_or_create(
            slug="full-stack-web-development",
            defaults={
                "title": "هندسة البرمجيات وتطوير الويب المتكامل",
                "title_en": "Full-Stack Software Engineering",
                "provider": ksu,
                "field_of_study": cs_field,
                "degree_level": "bachelor",
                "study_mode": "online",
                "language": "ar",
                "duration_months": 6,
                "credit_hours": 18,
                "tuition_fee": 5000.00,
                "currency": "SAR",
                "scholarship_available": True,
                "is_featured": True,
                "description": "برنامج عملي لتطوير تطبيقات الويب الحديثة باستخدام React و Django و Next.js.",
                "is_active": True,
                "status": "active",
                "max_students": 100,
            }
        )

        # 5. Application (Enrollment) for student_demo
        ProgramApplication.objects.get_or_create(
            applicant=student,
            program=ai_program,
            defaults={
                "status": "enrolled",
                "full_name": "طالب تجريبي ليرنوف",
                "email": "student@learnnov.edu.sa",
                "phone": "+966500000000",
                "highest_qualification": "bachelor",
                "graduation_year": 2024,
                "gpa": 4.5,
            }
        )

        # 6. Modules and Lessons for AI Program
        mod1, _ = ProgramModule.objects.get_or_create(
            program=ai_program,
            title="الوحدة الأولى: أساسيات الذكاء الاصطناعي",
            defaults={
                "description": "مقدمة شاملة حول علم الذكاء الاصطناعي وتطبيقاته.",
                "order": 1
            }
        )
        mod2, _ = ProgramModule.objects.get_or_create(
            program=ai_program,
            title="الوحدة الثانية: شبكات التعلم العميق والشبكات العصبية",
            defaults={
                "description": "مفاهيم الشبكات العصبية وبنائها عملياً باستخدام بايثون.",
                "order": 2
            }
        )

        # Lessons for Mod 1
        ProgramLesson.objects.get_or_create(
            module=mod1,
            title="مقدمة تاريخية وتطبيقات عملية",
            defaults={
                "lesson_type": "video",
                "content": "شاهد الفيديو التعريفي وتاريخ نشوء الذكاء الاصطناعي.",
                "duration_minutes": 20,
                "order": 1,
                "is_preview": True,
            }
        )
        ProgramLesson.objects.get_or_create(
            module=mod1,
            title="شرح خوارزميات التعلم الآلي البسيطة",
            defaults={
                "lesson_type": "text",
                "content": "التعلم الآلي (Machine Learning) هو فرع من الذكاء الاصطناعي يركز على بناء أنظمة تتعلم من البيانات.",
                "duration_minutes": 15,
                "order": 2,
                "is_preview": False,
            }
        )
        ProgramLesson.objects.get_or_create(
            module=mod1,
            title="ملف المنهج وحالات الاستخدام في السعودية",
            defaults={
                "lesson_type": "pdf",
                "content": "مستند توضيحي لاستخدامات الذكاء الاصطناعي في تحقيق رؤية المملكة 2030.",
                "duration_minutes": 30,
                "order": 3,
                "is_preview": False,
            }
        )

        # Lessons for Mod 2
        ProgramLesson.objects.get_or_create(
            module=mod2,
            title="مفهوم العصبون والخلية العصبية الاصطناعية",
            defaults={
                "lesson_type": "text",
                "content": "مفهوم البيرسبترون (Perceptron) وكيف يعمل العصبون الرياضي.",
                "duration_minutes": 15,
                "order": 1,
                "is_preview": False,
            }
        )
        ProgramLesson.objects.get_or_create(
            module=mod2,
            title="بناء نموذج تصنيف مبدئي",
            defaults={
                "lesson_type": "video",
                "content": "تطبيق عملي خطوة بخطوة لبناء وتدريب شبكة عصبية بسيطة باستخدام مكتبة TensorFlow.",
                "duration_minutes": 45,
                "order": 2,
                "is_preview": False,
            }
        )

        # 7. Mock Exam with Questions and Choices
        exam, _ = MockExam.objects.get_or_create(
            course_id="artificial-intelligence",
            defaults={
                "title": "الاختبار الشامل لأساسيات الذكاء الاصطناعي",
                "description": "اختبار تقييمي لقياس استيعابك للمفاهيم التأسيسية وخوارزميات الشبكات العصبية.",
                "time_limit_minutes": 15,
            }
        )

        # Questions
        q1, _ = Question.objects.get_or_create(
            exam=exam,
            text="ما هو العلم الذي يختص بمحاكاة السلوك الذكي البشري بواسطة الآلات؟",
            defaults={"points": 5, "question_type": "mcq"}
        )
        Choice.objects.get_or_create(question=q1, text="الذكاء الاصطناعي", defaults={"is_correct": True})
        Choice.objects.get_or_create(question=q1, text="تطوير تطبيقات الويب", defaults={"is_correct": False})
        Choice.objects.get_or_create(question=q1, text="هندسة الكهرباء", defaults={"is_correct": False})
        Choice.objects.get_or_create(question=q1, text="قواعد البيانات العامة", defaults={"is_correct": False})

        q2, _ = Question.objects.get_or_create(
            exam=exam,
            text="أي من التالي يعتبر أشهر لغات البرمجة المستخدمة في نمذجة وتدريب نماذج الذكاء الاصطناعي؟",
            defaults={"points": 5, "question_type": "mcq"}
        )
        Choice.objects.get_or_create(question=q2, text="بايثون (Python)", defaults={"is_correct": True})
        Choice.objects.get_or_create(question=q2, text="أتش تي أم أل (HTML)", defaults={"is_correct": False})
        Choice.objects.get_or_create(question=q2, text="سي بلس بلس القديمة (C++)", defaults={"is_correct": False})
        Choice.objects.get_or_create(question=q2, text="لغة التجميع (Assembly)", defaults={"is_correct": False})

        q3, _ = Question.objects.get_or_create(
            exam=exam,
            text="الشبكة العصبية الاصطناعية مصممة مستوحاة من محاكاة الخلايا العصبية البيولوجية للدماغ البشري.",
            defaults={"points": 5, "question_type": "tf"}
        )
        Choice.objects.get_or_create(question=q3, text="صح", defaults={"is_correct": True})
        Choice.objects.get_or_create(question=q3, text="خطأ", defaults={"is_correct": False})

        # 8. Discussion Thread and replies
        thread, _ = DiscussionThread.objects.get_or_create(
            program=ai_program,
            author=student,
            title="سؤال بخصوص تثبيت بيئة عمل مكتبة TensorFlow",
            defaults={
                "body": "يظهر لي خطأ في تثبيت TensorFlow على نظام ويندوز بخصوص حزمة Microsoft C++ Redistributable. هل واجه أحدكم هذا الخطأ؟",
                "is_pinned": False,
                "is_resolved": True,
            }
        )
        DiscussionPost.objects.get_or_create(
            thread=thread,
            author=dr_ali,
            body="أهلاً بك يا بطل. قم بتحميل وتثبيت الحزمة المطلوبة من موقع مايكروسوفت الرسمي ثم قم بإعادة تشغيل الجهاز وتجربة أمر التثبيت pip install tensorflow وسيتحسن الأمر.",
            defaults={
                "is_instructor_reply": True,
                "is_accepted_answer": True
            }
        )

        # 9. Generated Certificate
        GeneratedCertificate.objects.get_or_create(
            user=student,
            course_id="artificial-intelligence",
            defaults={
                "verify_uuid": "e938da62bc81442bb59ea2e16f393847",
                "course_name": "الذكاء الاصطناعي وهندسة البيانات",
                "grade": "95%",
                "status": "downloadable",
            }
        )

        # 10. Discount Code
        DiscountCode.objects.get_or_create(
            code="LEARNNOV2026",
            defaults={
                "discount_percentage": 20.00,
                "max_uses_total": 500,
                "max_uses_per_user": 2,
                "is_active": True,
            }
        )

        # 11. Order/Invoice
        Order.objects.get_or_create(
            user=student,
            course_id="artificial-intelligence",
            defaults={
                "program": ai_program,
                "course_name": "الذكاء الاصطناعي وهندسة البيانات",
                "amount": 9600.00,
                "gateway": PaymentGateway.STRIPE,
                "status": OrderStatus.PAID,
            }
        )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
