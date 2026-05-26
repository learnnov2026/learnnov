from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.academic_programs.models import FieldOfStudy, ProgramProvider, AcademicProgram

class Command(BaseCommand):
    help = 'Seed the database with high-quality academic data for LearnNov.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting database seeding...'))
        
        User = get_user_model()
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Please create a superuser first!'))
            return

        # 1. Create Fields of Study
        fields_data = [
            {'name': 'علوم الحاسب والذكاء الاصطناعي', 'name_en': 'Computer Science & AI', 'slug': 'computer-science-ai', 'icon': 'fa-laptop-code', 'sort_order': 1},
            {'name': 'إدارة الأعمال والاقتصاد', 'name_en': 'Business Administration & Economics', 'slug': 'business-economics', 'icon': 'fa-chart-line', 'sort_order': 2},
            {'name': 'الهندسة والعلوم التطبيقية', 'name_en': 'Engineering & Applied Sciences', 'slug': 'engineering', 'icon': 'fa-cog', 'sort_order': 3},
            {'name': 'العلوم الطبية والصحية', 'name_en': 'Medical & Health Sciences', 'slug': 'medical-sciences', 'icon': 'fa-heartbeat', 'sort_order': 4},
            {'name': 'العلوم الإنسانية والآداب', 'name_en': 'Humanities & Arts', 'slug': 'humanities-arts', 'icon': 'fa-book-open', 'sort_order': 5},
        ]
        
        fields = {}
        for f_data in fields_data:
            field, created = FieldOfStudy.objects.get_or_create(
                slug=f_data['slug'],
                defaults={
                    'name': f_data['name'],
                    'name_en': f_data['name_en'],
                    'icon': f_data['icon'],
                    'sort_order': f_data['sort_order'],
                    'is_active': True
                }
            )
            fields[f_data['slug']] = field
            if created:
                self.stdout.write(self.style.SUCCESS(f"Field created: {field.name}"))

        # 2. Create Providers
        providers_data = [
            {
                'name': 'جامعة الملك سعود',
                'name_en': 'King Saud University',
                'slug': 'king-saud-university',
                'provider_type': 'university',
                'city': 'الرياض',
                'website': 'https://ksu.edu.sa',
                'description': 'الجامعة الحكومية الأولى والأقدم في المملكة العربية السعودية، تم تأسيسها لتكون صرحاً علمياً وبحثياً رائداً في المنطقة.',
                'accreditation': 'both',
                'contact_email': 'info@ksu.edu.sa',
                'is_verified': True
            },
            {
                'name': 'جامعة الملك عبدالعزيز',
                'name_en': 'King Abdulaziz University',
                'slug': 'king-abdulaziz-university',
                'provider_type': 'university',
                'city': 'جدة',
                'website': 'https://kau.edu.sa',
                'description': 'جامعة حكومية سعودية رائدة، تحتل مرتبة متقدمة في التصنيفات العالمية وتتميز بأبحاثها العلمية والابتكار.',
                'accreditation': 'both',
                'contact_email': 'info@kau.edu.sa',
                'is_verified': True
            },
            {
                'name': 'جامعة الأمير سلطان',
                'name_en': 'Prince Sultan University',
                'slug': 'prince-sultan-university',
                'provider_type': 'university',
                'city': 'الرياض',
                'website': 'https://psu.edu.sa',
                'description': 'أول جامعة أهلية غير ربحية في المملكة العربية السعودية، تقدم برامج أكاديمية متميزة بمعايير عالمية.',
                'accreditation': 'both',
                'contact_email': 'info@psu.edu.sa',
                'is_verified': True
            },
        ]

        providers = {}
        for p_data in providers_data:
            provider, created = ProgramProvider.objects.get_or_create(
                slug=p_data['slug'],
                defaults={
                    'name': p_data['name'],
                    'name_en': p_data['name_en'],
                    'provider_type': p_data['provider_type'],
                    'city': p_data['city'],
                    'website': p_data['website'],
                    'description': p_data['description'],
                    'accreditation': p_data['accreditation'],
                    'contact_email': p_data['contact_email'],
                    'is_verified': p_data['is_verified'],
                    'is_active': True
                }
            )
            providers[p_data['slug']] = provider
            if created:
                self.stdout.write(self.style.SUCCESS(f"Provider created: {provider.name}"))

        # 3. Create Programs
        programs_data = [
            {
                'provider': 'king-saud-university',
                'field': 'computer-science-ai',
                'title': 'ماجستير العلوم في الذكاء الاصطناعي',
                'title_en': 'M.Sc. in Artificial Intelligence',
                'slug': 'msc-artificial-intelligence',
                'degree_level': 'master',
                'study_mode': 'online',
                'language': 'ar_en',
                'duration_months': 24,
                'credit_hours': 36,
                'description': 'برنامج نوعي يهدف إلى تزويد الطلاب بالمعرفة والمهارات اللازمة في مجالات الذكاء الاصطناعي المتقدمة وتطبيقات التعلم الآلي ومعالجة اللغات الطبيعية.',
                'tuition_fee': 45000.00,
                'is_featured': True
            },
            {
                'provider': 'king-abdulaziz-university',
                'field': 'computer-science-ai',
                'title': 'ماجستير العلوم في الأمن السيبراني',
                'title_en': 'M.Sc. in Cybersecurity',
                'slug': 'msc-cybersecurity',
                'degree_level': 'master',
                'study_mode': 'blended',
                'language': 'en',
                'duration_months': 24,
                'credit_hours': 36,
                'description': 'برنامج يركز على تأهيل كفاءات وطنية متميزة في حماية الشبكات والأنظمة الرقمية وتحليل الثغرات الأمنية والتحقيق الجنائي الرقمي.',
                'tuition_fee': 48000.00,
                'is_featured': True
            },
            {
                'provider': 'prince-sultan-university',
                'field': 'business-economics',
                'title': 'ماجستير إدارة الأعمال التنفيذي (EMBA)',
                'title_en': 'Executive MBA',
                'slug': 'executive-mba-psu',
                'degree_level': 'master',
                'study_mode': 'blended',
                'language': 'en',
                'duration_months': 18,
                'credit_hours': 42,
                'description': 'برنامج رائد ومصمم للقادة والمديرين التنفيذيين الذين يسعون لتطوير مهاراتهم الإستراتيجية والقيادية في عالم الأعمال المتغير.',
                'tuition_fee': 60000.00,
                'is_featured': True
            },
            {
                'provider': 'king-saud-university',
                'field': 'business-economics',
                'title': 'بكالوريوس العلوم في المالية والاستثمار',
                'title_en': 'B.Sc. in Finance & Investment',
                'slug': 'bsc-finance-investment',
                'degree_level': 'bachelor',
                'study_mode': 'on_campus',
                'language': 'ar_en',
                'duration_months': 48,
                'credit_hours': 130,
                'description': 'برنامج متميز يؤهل الطلاب للعمل في أسواق المال والمصارف الاستثمارية وإدارة المحافظ والتحليل المالي بمستوى احترافي عالي.',
                'tuition_fee': 0.00,
                'is_featured': False
            },
            {
                'provider': 'prince-sultan-university',
                'field': 'computer-science-ai',
                'title': 'دبلوم تطوير تطبيقات الويب المتكاملة (Full Stack)',
                'title_en': 'Full Stack Web Development Diploma',
                'slug': 'full-stack-web-diploma',
                'degree_level': 'diploma',
                'study_mode': 'online',
                'language': 'ar_en',
                'duration_months': 6,
                'credit_hours': 0,
                'description': 'دبلوم مهني مكثف وعملي يؤهل المتدربين لتصميم وبناء واجهات ومخدمات تطبيقات الويب الحديثة باستخدام أشهر أطر العمل العالمية.',
                'tuition_fee': 12000.00,
                'is_featured': False
            },
        ]

        for p_info in programs_data:
            provider = providers.get(p_info['provider'])
            field = fields.get(p_info['field'])
            
            if not provider or not field:
                continue
                
            program, created = AcademicProgram.objects.get_or_create(
                slug=p_info['slug'],
                defaults={
                    'provider': provider,
                    'field_of_study': field,
                    'title': p_info['title'],
                    'title_en': p_info['title_en'],
                    'degree_level': p_info['degree_level'],
                    'study_mode': p_info['study_mode'],
                    'language': p_info['language'],
                    'duration_months': p_info['duration_months'],
                    'credit_hours': p_info['credit_hours'],
                    'description': p_info['description'],
                    'tuition_fee': p_info['tuition_fee'],
                    'is_featured': p_info['is_featured'],
                    'status': 'active',
                    'is_active': True,
                    'created_by': admin_user
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Program created: {program.title}"))

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
