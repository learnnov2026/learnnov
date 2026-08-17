from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse
from apps.core.permissions import IsStudent, IsProviderAdmin
from .models import (
    ProgramProvider, FieldOfStudy, AcademicProgram,
    ProgramApplication, UserReferral, FinancialAidApplication,
    PeerAssignmentSubmission, PeerReviewAssessment
)
from .serializers import (
    ProgramProviderSerializer, FieldOfStudySerializer,
    AcademicProgramListSerializer, AcademicProgramDetailSerializer,
    ProgramApplicationSerializer, ApplicationReviewSerializer,
    AcademicProgramCreateSerializer, FinancialAidApplicationSerializer,
    FinancialAidApplicationReviewSerializer,
    PeerAssignmentSubmissionSerializer, PeerReviewAssessmentSerializer
)


class FieldOfStudyListView(generics.ListAPIView):
    queryset = FieldOfStudy.objects.filter(is_active=True)
    serializer_class = FieldOfStudySerializer
    permission_classes = [permissions.AllowAny]


class ProviderListView(generics.ListAPIView):
    queryset = ProgramProvider.objects.filter(is_active=True)
    serializer_class = ProgramProviderSerializer
    permission_classes = [permissions.AllowAny]


class ProviderDetailView(generics.RetrieveAPIView):
    queryset = ProgramProvider.objects.filter(is_active=True)
    serializer_class = ProgramProviderSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


class ProgramListView(generics.ListAPIView):
    serializer_class = AcademicProgramListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = AcademicProgram.objects.filter(is_active=True).select_related('provider', 'field_of_study')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)
        degree = self.request.query_params.get('degree_level')
        if degree:
            qs = qs.filter(degree_level=degree)
        provider = self.request.query_params.get('provider')
        if provider:
            qs = qs.filter(provider__slug=provider)
        field = self.request.query_params.get('field')
        if field:
            qs = qs.filter(field_of_study__slug=field)
        return qs


class ProgramDetailView(generics.RetrieveAPIView):
    queryset = AcademicProgram.objects.filter(is_active=True).select_related('provider', 'field_of_study')
    serializer_class = AcademicProgramDetailSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.increment_views()
        return super().retrieve(request, *args, **kwargs)


class ProgramApplyView(generics.CreateAPIView):
    serializer_class = ProgramApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        referral_code = self.request.session.get('referral_code', '') if hasattr(self.request, 'session') else ''
        from django.db import IntegrityError
        from rest_framework.exceptions import ValidationError
        try:
            serializer.save(applicant=user, referral_code=referral_code)
        except IntegrityError:
            raise ValidationError({'error': 'لقد قمت بالتقديم لهذا البرنامج مسبقاً.'})


class MyApplicationsView(generics.ListAPIView):
    serializer_class = ProgramApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProgramApplication.objects.filter(applicant=self.request.user).order_by('-submitted_at')


class ApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = ProgramApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return ProgramApplication.objects.all()
        return ProgramApplication.objects.filter(applicant=self.request.user)


class ApplicationReviewView(generics.UpdateAPIView):
    serializer_class = ApplicationReviewSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = ProgramApplication.objects.all()


class StudentSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
            
        apps = ProgramApplication.objects.filter(applicant=user)
        referral, _ = UserReferral.generate_code_for_user(user)
        
        from apps.learnnov_exams.models import ExamAttempt
        from apps.learnnov_certificates.models import GeneratedCertificate
        from apps.course_discussions.models import DiscussionThread
        
        exams_passed = ExamAttempt.objects.filter(user=user, is_completed=True, score__gte=50).count()
        certs_earned = GeneratedCertificate.objects.filter(user=user, status='downloadable').count()
        discussions_started = DiscussionThread.objects.filter(author=user).count()

        return Response({
            'active_applications': apps.exclude(status__in=['withdrawn', 'rejected']).count(),
            'total_applications': apps.count(),
            'referral_code': referral.code,
            'referral_points': referral.points,
            'exams_passed': exams_passed,
            'certificates_earned': certs_earned,
            'discussions_started': discussions_started,
        })


def program_stats(request):
    """إحصائيات عامة."""
    return JsonResponse({
        'total_programs': AcademicProgram.objects.filter(is_active=True).count(),
        'total_providers': ProgramProvider.objects.filter(is_active=True).count(),
        'total_applications': ProgramApplication.objects.count(),
    })


from .serializers import ProgramModuleSerializer
from .models import ProgramModule

class ProgramSyllabusView(generics.ListAPIView):
    """
    Returns the syllabus (Modules and Lessons) for a specific course.
    
    الوصول:
    - المستخدمون غير الملتحقين: يرون عناوين الوحدات فقط (بدون محتوى مغلق).
    - المستخدمون الملتحقون والمشرفون: يرون جميع التفاصيل.
    محتوى الدروس الفردية محمي أيضاً في ProgramLessonSerializer.
    """
    serializer_class = ProgramModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        slug = self.kwargs.get('slug')
        user = self.request.user

        # التحقق من وجود البرنامج أولاً
        program = get_object_or_404(AcademicProgram, slug=slug, is_active=True)

        # التحقق من التسجيل — المشرفون والمدراء يتجاوزون هذا الشرط
        if not (user.is_staff or user.is_superuser or user.groups.filter(name='Instructors').exists()):
            from apps.core.permissions import has_active_enrollment
            if not has_active_enrollment(user, program):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    'يجب أن تكون مسجلاً في هذا البرنامج للاطلاع على محتواه التفصيلي.'
                )

        return ProgramModule.objects.filter(program__slug=slug).prefetch_related('lessons')


class ProgramCreateView(generics.CreateAPIView):
    queryset = AcademicProgram.objects.all()
    serializer_class = AcademicProgramCreateSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


from django.shortcuts import get_object_or_404
from .models import ProgramLesson
from .serializers import ProgramModuleCreateSerializer, ProgramLessonCreateSerializer

class ModuleListCreateView(generics.ListCreateAPIView):
    """عرض وإنشاء وحدات دراسية لبرنامج محدد."""
    permission_classes = [permissions.IsAdminUser]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProgramModuleCreateSerializer
        return ProgramModuleSerializer
    
    def get_queryset(self):
        slug = self.kwargs.get('slug')
        return ProgramModule.objects.filter(program__slug=slug).prefetch_related('lessons')
    
    def perform_create(self, serializer):
        slug = self.kwargs.get('slug')
        program = get_object_or_404(AcademicProgram, slug=slug)
        serializer.save(program=program)

class ModuleUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """تعديل أو حذف وحدة دراسية."""
    serializer_class = ProgramModuleCreateSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = ProgramModule.objects.all()

class LessonListCreateView(generics.ListCreateAPIView):
    """عرض وإنشاء دروس لوحدة محددة."""
    permission_classes = [permissions.IsAdminUser]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProgramLessonCreateSerializer
        return ProgramLessonSerializer
    
    def get_queryset(self):
        module_id = self.kwargs.get('pk')
        return ProgramLesson.objects.filter(module_id=module_id)
    
    def perform_create(self, serializer):
        module_id = self.kwargs.get('pk')
        module = get_object_or_404(ProgramModule, id=module_id)
        serializer.save(module=module)

class LessonUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """تعديل أو حذف درس."""
    serializer_class = ProgramLessonCreateSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = ProgramLesson.objects.all()


from .models import Specialization, SpecializationEnrollment
from .serializers import SpecializationListSerializer, SpecializationDetailSerializer

class SpecializationListView(generics.ListAPIView):
    queryset = Specialization.objects.filter(is_active=True).select_related('provider')
    serializer_class = SpecializationListSerializer
    permission_classes = [permissions.AllowAny]


class SpecializationDetailView(generics.RetrieveAPIView):
    queryset = Specialization.objects.filter(is_active=True).select_related('provider')
    serializer_class = SpecializationDetailSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


class SpecializationEnrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        from apps.academic_programs.services import enroll_user_in_specialization
        enrollment = enroll_user_in_specialization(request.user, slug)
        return Response({
            'message': 'تم الالتحاق بالمسار التخصصي وكافة مقرراته بنجاح!',
            'status': enrollment.status
        }, status=status.HTTP_200_OK)


from django.utils import timezone

class FinancialAidSubmitView(generics.CreateAPIView):
    """تمكين الطلاب من تقديم طلب دعم مالي لبرنامج معين."""
    serializer_class = FinancialAidApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)


class MyFinancialAidListView(generics.ListAPIView):
    """عرض طلبات الدعم المالي الخاصة بالطالب الحالي."""
    serializer_class = FinancialAidApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FinancialAidApplication.objects.filter(applicant=self.request.user)


class FinancialAidReviewView(generics.UpdateAPIView):
    """لوحة التحكم للإدارة لمراجعة وقبول أو رفض طلبات الدعم المالي."""
    queryset = FinancialAidApplication.objects.all()
    serializer_class = FinancialAidApplicationReviewSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_update(self, serializer):
        instance = serializer.save(
            reviewed_by=self.request.user,
            reviewed_at=timezone.now()
        )
        if instance.status == 'approved':
            # تسجيل الطالب تلقائياً في الكورس/البرنامج كطالب ملتحق
            ProgramApplication.objects.update_or_create(
                program=instance.program,
                applicant=instance.applicant,
                defaults={
                    'status': 'enrolled',
                    'full_name': f"{instance.applicant.first_name} {instance.applicant.last_name}".strip() or instance.applicant.username,
                    'email': instance.applicant.email or 'student@learnnov.org',
                    'phone': '0500000000',
                }
            )


class FinancialAidReviewListView(generics.ListAPIView):
    """عرض قائمة بجميع طلبات الدعم المالي للمسؤولين."""
    queryset = FinancialAidApplication.objects.all().order_by('-created_at')
    serializer_class = FinancialAidApplicationSerializer
    permission_classes = [permissions.IsAdminUser]


import random
from django.db.models import Count, Q

class PeerSubmissionCreateView(generics.CreateAPIView):
    """تسليم واجب تقييم الزملاء."""
    serializer_class = PeerAssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class PeerReviewSubmitView(generics.CreateAPIView):
    """تقديم تقييم لواجب زميل."""
    serializer_class = PeerReviewAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class PeerReviewRandomGetView(APIView):
    """الحصول على واجب عشوائي لزميل آخر للتقييم."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        lesson_id = request.query_params.get('lesson_id')
        if not lesson_id:
            return Response({"error": "يجب تقديم معرف الدرس lesson_id."}, status=status.HTTP_400_BAD_REQUEST)

        # البحث عن واجبات تم تسليمها في هذا الدرس من طلاب آخرين،
        # ولم يقم المستخدم الحالي بتقييمها بعد،
        # ولم تحصل بعد على 3 تقييمات.
        submissions = PeerAssignmentSubmission.objects.filter(lesson_id=lesson_id)\
            .exclude(student=request.user)\
            .exclude(reviews_received__reviewer=request.user)\
            .annotate(reviews_count=Count('reviews_received'))\
            .filter(reviews_count__lt=3)

        if submissions.exists():
            submission = random.choice(list(submissions))
            serializer = PeerAssignmentSubmissionSerializer(submission, context={'request': request})
            return Response(serializer.data)
            
        return Response(
            {"detail": "لا توجد واجبات متاحة للتقييم حالياً من زملائك في هذا الدرس."},
            status=status.HTTP_404_NOT_FOUND
        )


class PeerReviewStatusView(APIView):
    """الحصول على حالة التقييم واكتمال درس تقييم الزملاء للمستخدم الحالي."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        lesson_id = request.query_params.get('lesson_id')
        if not lesson_id:
            return Response({"error": "يجب تقديم معرف الدرس lesson_id."}, status=status.HTTP_400_BAD_REQUEST)

        # البحث عن تسليم المستخدم الحالي
        user_submission = PeerAssignmentSubmission.objects.filter(
            student=request.user,
            lesson_id=lesson_id
        ).first()

        # حساب عدد التقييمات التي قدمها المستخدم الحالي لواجبات الآخرين في هذا الدرس
        reviews_given_count = PeerReviewAssessment.objects.filter(
            reviewer=request.user,
            submission__lesson_id=lesson_id
        ).count()

        if user_submission:
            has_submitted = True
            submission_id = user_submission.id
            submission_text = user_submission.submission_text
            reviews_received = user_submission.reviews_received.all()
            reviews_received_count = reviews_received.count()
            if reviews_received_count > 0:
                average_score = sum(r.score for r in reviews_received) / reviews_received_count
            else:
                average_score = None
            feedbacks = [
                {
                    "id": r.id,
                    "score": r.score,
                    "feedback": r.feedback,
                    "reviewer_username": r.reviewer.username
                }
                for r in reviews_received
            ]
        else:
            has_submitted = False
            submission_id = None
            submission_text = None
            reviews_received_count = 0
            average_score = None
            feedbacks = []

        # الدرس يعتبر مكتملاً إذا قام المستخدم بالتسليم وقام بتقييم 3 واجبات على الأقل للزملاء
        is_completed = has_submitted and (reviews_given_count >= 3)

        return Response({
            "has_submitted": has_submitted,
            "submission_id": submission_id,
            "submission_text": submission_text,
            "reviews_given_count": reviews_given_count,
            "reviews_received_count": reviews_received_count,
            "average_score": average_score,
            "feedbacks": feedbacks,
            "is_completed": is_completed
        })




