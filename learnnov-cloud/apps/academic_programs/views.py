from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse
from apps.core.permissions import IsStudent, IsProviderAdmin
from .models import (
    ProgramProvider, FieldOfStudy, AcademicProgram,
    ProgramApplication, UserReferral
)
from .serializers import (
    ProgramProviderSerializer, FieldOfStudySerializer,
    AcademicProgramListSerializer, AcademicProgramDetailSerializer,
    ProgramApplicationSerializer, ApplicationReviewSerializer,
    AcademicProgramCreateSerializer
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
        serializer.save(applicant=user, referral_code=referral_code)


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
    """
    serializer_class = ProgramModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        slug = self.kwargs.get('slug')
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
