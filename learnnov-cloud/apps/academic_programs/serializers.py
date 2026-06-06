from rest_framework import serializers
from .models import ProgramProvider, FieldOfStudy, AcademicProgram, ProgramApplication


class FieldOfStudySerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldOfStudy
        fields = ['id', 'name', 'name_en', 'slug', 'icon', 'parent']


class ProgramProviderSerializer(serializers.ModelSerializer):
    active_programs_count = serializers.SerializerMethodField()

    class Meta:
        model = ProgramProvider
        fields = [
            'id', 'name', 'name_en', 'slug', 'provider_type', 'country', 'city',
            'logo', 'website', 'description', 'accreditation', 'is_verified',
            'active_programs_count',
        ]

    def get_active_programs_count(self, obj):
        return obj.get_active_programs_count()


class AcademicProgramListSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    provider_logo = serializers.ImageField(source='provider.logo', read_only=True)
    field_name = serializers.CharField(source='field_of_study.name', read_only=True)
    degree_level_display = serializers.CharField(source='get_degree_level_display', read_only=True)
    study_mode_display = serializers.CharField(source='get_study_mode_display', read_only=True)
    is_open = serializers.BooleanField(source='is_open_for_applications', read_only=True)

    class Meta:
        model = AcademicProgram
        fields = [
            'id', 'title', 'title_en', 'slug', 'provider_name', 'provider_logo',
            'field_name', 'degree_level', 'degree_level_display',
            'study_mode', 'study_mode_display', 'language',
            'duration_months', 'tuition_fee', 'currency',
            'scholarship_available', 'is_featured', 'cover_image',
            'application_deadline', 'start_date', 'is_open',
            'views_count', 'applications_count',
        ]


class AcademicProgramDetailSerializer(serializers.ModelSerializer):
    provider = ProgramProviderSerializer(read_only=True)
    field_of_study = FieldOfStudySerializer(read_only=True)
    degree_level_display = serializers.CharField(source='get_degree_level_display', read_only=True)
    study_mode_display = serializers.CharField(source='get_study_mode_display', read_only=True)
    is_open = serializers.BooleanField(source='is_open_for_applications', read_only=True)

    class Meta:
        model = AcademicProgram
        fields = [
            'id', 'title', 'title_en', 'slug', 'provider', 'field_of_study',
            'degree_level', 'degree_level_display', 'study_mode', 'study_mode_display',
            'language', 'duration_months', 'credit_hours', 'description',
            'objectives', 'requirements', 'curriculum_overview',
            'tuition_fee', 'currency', 'scholarship_available',
            'is_featured', 'cover_image', 'brochure',
            'application_deadline', 'start_date', 'max_students',
            'is_open', 'views_count', 'applications_count', 'created_at',
        ]

    def validate_description(self, value):
        from apps.core.bleach_utils import sanitize_html
        return sanitize_html(value)
        
    def validate_objectives(self, value):
        from apps.core.bleach_utils import sanitize_html
        return sanitize_html(value)
        
    def validate_curriculum_overview(self, value):
        from apps.core.bleach_utils import sanitize_html
        return sanitize_html(value)


class ProgramApplicationSerializer(serializers.ModelSerializer):
    program_title = serializers.CharField(source='program.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ProgramApplication
        fields = [
            'id', 'program', 'program_title', 'status', 'status_display',
            'full_name', 'email', 'phone', 'nationality', 'date_of_birth',
            'highest_qualification', 'graduation_year', 'gpa',
            'work_experience_years', 'personal_statement',
            'cv', 'transcripts', 'additional_docs',
            'submitted_at', 'updated_at',
        ]
        read_only_fields = ['status', 'submitted_at', 'updated_at']

    def validate(self, data):
        request = self.context.get('request')
        user = request.user if request else None
        program = data.get('program') or (self.instance.program if self.instance else None)
        if program and not program.is_open_for_applications:
            raise serializers.ValidationError('هذا البرنامج غير متاح للتقديم حالياً.')
        if not self.instance and user and program:
            if ProgramApplication.objects.filter(applicant=user, program=program).exists():
                raise serializers.ValidationError('لقد قمت بالتقديم لهذا البرنامج مسبقاً.')
        return data


class ApplicationReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramApplication
        fields = ['status', 'reviewer_notes']

    VALID_TRANSITIONS = {
        'submitted': ['under_review', 'rejected', 'withdrawn'],
        'under_review': ['accepted', 'rejected', 'waitlisted', 'withdrawn'],
        'waitlisted': ['accepted', 'rejected', 'withdrawn'],
        'accepted': ['withdrawn'],
        'rejected': ['under_review'],
        'withdrawn': [],
    }

    def validate_status(self, value):
        if self.instance:
            current = self.instance.status
            allowed = self.VALID_TRANSITIONS.get(current, [])
            if value not in allowed:
                raise serializers.ValidationError(
                    f'لا يمكن تغيير الحالة من "{current}" إلى "{value}".'
                )
        return value

    def update(self, instance, validated_data):
        from django.utils import timezone
        from .models import ApplicationStatusHistory

        old_status = instance.status
        new_status = validated_data.get('status', instance.status)
        instance.status = new_status
        instance.reviewer_notes = validated_data.get('reviewer_notes', instance.reviewer_notes)
        
        # Require an authenticated user for reviews
        request = self.context.get('request')
        user = request.user if (request and request.user and request.user.is_authenticated) else None
        if not user:
            raise serializers.ValidationError("يجب تسجيل الدخول لإجراء المراجعة.")
            
        instance.reviewed_by = user
        instance.reviewed_at = timezone.now()
        instance.save()

        if old_status != new_status:
            ApplicationStatusHistory.objects.create(
                application=instance, old_status=old_status, new_status=new_status,
                changed_by=user, notes=instance.reviewer_notes
            )
        return instance

from .models import ProgramModule, ProgramLesson

class ProgramLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramLesson
        fields = ['id', 'title', 'lesson_type', 'content', 'media_file', 'duration_minutes', 'order', 'is_preview']

    def to_representation(self, instance):
        """
        Hide media_file and content if the user is not enrolled and the lesson is not a preview.
        """
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request else None

        if not instance.is_preview:
            # Check enrollment
            from apps.core.permissions import has_active_enrollment
            is_enrolled = has_active_enrollment(user, instance.module.program)
            
            if not is_enrolled:
                ret.pop('media_file', None)
                ret.pop('content', None)
                ret['is_locked'] = True
            else:
                ret['is_locked'] = False
        else:
            ret['is_locked'] = False
            
        return ret


class ProgramModuleSerializer(serializers.ModelSerializer):
    lessons = ProgramLessonSerializer(many=True, read_only=True)

    class Meta:
        model = ProgramModule
        fields = ['id', 'title', 'description', 'order', 'lessons']


class ProgramModuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramModule
        fields = ['id', 'program', 'title', 'description', 'order']


class ProgramLessonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramLesson
        fields = ['id', 'module', 'title', 'lesson_type', 'content', 'media_file', 'duration_minutes', 'order', 'is_preview']


class AcademicProgramCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicProgram
        fields = '__all__'


from .models import Specialization, SpecializationCourse, SpecializationEnrollment
from apps.learnnov_certificates.models import SpecializationCertificate
from apps.learnnov_exams.models import ExamAttempt

class SpecializationListSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    courses_count = serializers.SerializerMethodField()

    class Meta:
        model = Specialization
        fields = ['id', 'title', 'title_en', 'slug', 'description', 'cover_image', 'provider_name', 'courses_count']

    def get_courses_count(self, obj):
        return obj.courses.count()


class SpecializationDetailSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    provider_logo = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    certificate_uuid = serializers.SerializerMethodField()

    class Meta:
        model = Specialization
        fields = [
            'id', 'title', 'title_en', 'slug', 'description', 'cover_image',
            'provider_name', 'provider_logo', 'courses', 'is_enrolled',
            'progress_percentage', 'is_completed', 'certificate_uuid'
        ]

    def get_provider_logo(self, obj):
        request = self.context.get('request')
        if obj.provider.logo and request:
            return request.build_absolute_uri(obj.provider.logo.url)
        return None

    def get_courses(self, obj):
        specialization_courses = SpecializationCourse.objects.filter(specialization=obj).select_related('course', 'course__provider', 'course__field_of_study')
        request = self.context.get('request')
        courses_data = []
        for sc in specialization_courses:
            ser = AcademicProgramListSerializer(sc.course, context={'request': request})
            courses_data.append(ser.data)
        return courses_data

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser:
            return True
        return SpecializationEnrollment.objects.filter(user=user, specialization=obj).exists()

    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not user.is_authenticated:
            return 0
            
        courses = obj.courses.all()
        total_courses = courses.count()
        if total_courses == 0:
            return 100
            
        completed_count = 0
        from apps.learnnov_certificates.models import GeneratedCertificate
        for course in courses:
            has_cert = GeneratedCertificate.objects.filter(user=user, course_id=course.slug, status='downloadable').exists()
            if has_cert:
                completed_count += 1
                continue
            has_exam = ExamAttempt.objects.filter(user=user, exam__course_id=course.slug, is_completed=True, score__gte=50).exists()
            if has_exam:
                completed_count += 1
                
        return int((completed_count / total_courses) * 100) if total_courses > 0 else 100

    def get_is_completed(self, obj):
        return self.get_progress_percentage(obj) == 100

    def get_certificate_uuid(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or not user.is_authenticated:
            return None
        try:
            cert = SpecializationCertificate.objects.get(user=user, specialization=obj, status='downloadable')
            return cert.verify_uuid
        except SpecializationCertificate.DoesNotExist:
            return None

