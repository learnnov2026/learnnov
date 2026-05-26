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
            'is_open', 'views_count', 'applications_count',
            'edx_course_keys', 'created_at',
        ]


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

        # منع تكرار الطلبات لنفس البرنامج من نفس المستخدم
        if not self.instance and user and program:
            if ProgramApplication.objects.filter(applicant=user, program=program).exists():
                raise serializers.ValidationError('لقد قمت بالتقديم لهذا البرنامج مسبقاً.')

        return data

    # applicant is set by the view via serializer.save(applicant=request.user)


class ApplicationReviewSerializer(serializers.ModelSerializer):
    """للمراجعين فقط — تحديث حالة الطلب."""

    class Meta:
        model = ProgramApplication
        fields = ['status', 'reviewer_notes']

    # التحولات المسموحة بين الحالات
    VALID_TRANSITIONS = {
        'submitted': ['under_review', 'rejected', 'withdrawn'],
        'under_review': ['accepted', 'rejected', 'waitlisted', 'withdrawn'],
        'waitlisted': ['accepted', 'rejected', 'withdrawn'],
        'accepted': ['withdrawn'],
        'rejected': ['under_review'],  # السماح بإعادة المراجعة
        'withdrawn': [],  # الانسحاب نهائي
    }

    def validate_status(self, value):
        """التحقق من أن التغيير في الحالة يتبع التسلسل المنطقي."""
        if self.instance:
            current = self.instance.status
            allowed = self.VALID_TRANSITIONS.get(current, [])
            if value not in allowed:
                raise serializers.ValidationError(
                    f'لا يمكن تغيير الحالة من "{current}" إلى "{value}". '
                    f'الحالات المسموحة: {", ".join(allowed) if allowed else "لا يوجد"}'
                )
        return value

    def update(self, instance, validated_data):
        from django.utils import timezone
        
        # التحديث يتم ببساطة، والـ Signals تتولى الإشعارات والعدادات
        from .models import ApplicationStatusHistory
        
        old_status = instance.status
        new_status = validated_data.get('status', instance.status)
        
        instance.status = new_status
        instance.reviewer_notes = validated_data.get('reviewer_notes', instance.reviewer_notes)
        instance.reviewed_by = self.context['request'].user
        instance.reviewed_at = timezone.now()
        instance.save()
        
        # تسجيل تاريخ الحالة إذا تغيرت
        if old_status != new_status:
            ApplicationStatusHistory.objects.create(
                application=instance,
                old_status=old_status,
                new_status=new_status,
                changed_by=self.context['request'].user,
                notes=instance.reviewer_notes
            )
        
        return instance
