from django.conf import settings
from django.db.models import Q, F
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .models import ProgramProvider, FieldOfStudy, AcademicProgram, ProgramApplication, UserReferral
from .serializers import (
    ProgramProviderSerializer, FieldOfStudySerializer,
    AcademicProgramListSerializer, AcademicProgramDetailSerializer,
    ProgramApplicationSerializer, ApplicationReviewSerializer,
)


class IsProviderStaff(permissions.BasePermission):
    """يسمح فقط لموظفي المؤسسة أو المشرفين."""
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_staff:
            return True
        # السماح لموظفي الجامعات الذين لديهم ربط بالـ Provider
        return hasattr(user, 'university') and user.university.provider_id is not None

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
            
        provider = obj if isinstance(obj, ProgramProvider) else obj.program.provider
        
        # التحقق من أن المستخدم موظف في هذه المؤسسة تحديداً
        if hasattr(request.user, 'university') and request.user.university.provider == provider:
            return True
            
        # Fallback: البريد الإلكتروني (للمرونة في الحالات الاستثنائية)
        return provider.is_active and provider.contact_email == request.user.email


# --- Fields of Study ---

class FieldOfStudyListView(generics.ListAPIView):
    """قائمة المجالات الدراسية."""
    serializer_class = FieldOfStudySerializer
    permission_classes = [permissions.AllowAny]
    queryset = FieldOfStudy.objects.filter(is_active=True).select_related('parent')


# --- Providers ---

class ProviderListView(generics.ListAPIView):
    """قائمة المؤسسات التعليمية."""
    serializer_class = ProgramProviderSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'name_en', 'country']

    def get_queryset(self):
        qs = ProgramProvider.objects.filter(is_active=True)
        country = self.request.query_params.get('country')
        provider_type = self.request.query_params.get('type')
        if country:
            qs = qs.filter(country__icontains=country)
        if provider_type:
            qs = qs.filter(provider_type=provider_type)
        return qs


class ProviderDetailView(generics.RetrieveAPIView):
    """تفاصيل مؤسسة تعليمية."""
    serializer_class = ProgramProviderSerializer
    permission_classes = [permissions.AllowAny]
    queryset = ProgramProvider.objects.filter(is_active=True)
    lookup_field = 'slug'


# --- Programs ---

class ProgramListView(generics.ListAPIView):
    """قائمة البرامج الأكاديمية مع فلترة وبحث."""
    serializer_class = AcademicProgramListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'title_en', 'description', 'provider__name']
    ordering_fields = ['created_at', 'tuition_fee', 'duration_months', 'views_count']
    ordering = ['-is_featured', '-created_at']

    def get_queryset(self):
        qs = AcademicProgram.objects.filter(
            status='active', is_active=True
        ).select_related('provider', 'field_of_study')

        field = self.request.query_params.get('field')
        degree = self.request.query_params.get('degree')
        mode = self.request.query_params.get('mode')
        provider = self.request.query_params.get('provider')
        min_fee = self.request.query_params.get('min_fee')
        max_fee = self.request.query_params.get('max_fee')
        language = self.request.query_params.get('language')
        scholarship = self.request.query_params.get('scholarship')
        featured = self.request.query_params.get('featured')

        if field:
            qs = qs.filter(Q(field_of_study__slug=field) | Q(field_of_study__parent__slug=field))
        if degree:
            qs = qs.filter(degree_level=degree)
        if mode:
            qs = qs.filter(study_mode=mode)
        if provider:
            qs = qs.filter(provider__slug=provider)
        if min_fee:
            qs = qs.filter(tuition_fee__gte=min_fee)
        if max_fee:
            qs = qs.filter(tuition_fee__lte=max_fee)
        if language:
            qs = qs.filter(language=language)
        if scholarship == 'true':
            qs = qs.filter(scholarship_available=True)
        if featured == 'true':
            qs = qs.filter(is_featured=True)

        return qs


class ProgramDetailView(generics.RetrieveAPIView):
    """تفاصيل برنامج أكاديمي — يزيد عداد المشاهدات."""
    serializer_class = AcademicProgramDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = AcademicProgram.objects.filter(status='active', is_active=True)
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        AcademicProgram.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# --- Applications ---

class ApplyRateThrottle(UserRateThrottle):
    rate = '5/minute'

class ProgramApplyView(generics.CreateAPIView):
    """تقديم طلب للبرنامج."""
    serializer_class = ProgramApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ApplyRateThrottle]

    def perform_create(self, serializer):
        # التقاط كود الإحالة من الجلسة إذا وجد
        referral_code = self.request.session.get('referral_code', '')
        serializer.save(
            applicant=self.request.user,
            referral_code=self.request.data.get('referral_code', referral_code)
        )


class MyApplicationsView(generics.ListAPIView):
    """طلباتي الشخصية."""
    serializer_class = ProgramApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProgramApplication.objects.filter(
            applicant=self.request.user
        ).select_related('program', 'program__provider')


class ApplicationDetailView(generics.RetrieveAPIView):
    """تفاصيل طلب محدد."""
    serializer_class = ProgramApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return ProgramApplication.objects.all()
        
        # السماح لموظفي المؤسسة برؤية الطلبات المقدمة لبرامجهم
        if hasattr(user, 'university') and user.university and user.university.provider:
            return ProgramApplication.objects.filter(program__provider=user.university.provider)
            
        return ProgramApplication.objects.filter(applicant=user)


# UserRateThrottle imported at module top

class ReferralRateThrottle(UserRateThrottle):
    rate = '10/minute'

class MyReferralView(APIView):
    """عرض كود الإحالة ونقاط المستخدم."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ReferralRateThrottle]

    def get(self, request):
        referral, created = UserReferral.generate_code_for_user(request.user)
        return Response({
            'referral_code': referral.code,
            'points': referral.points,
            'total_referred': referral.total_referred,
            'referral_url': f"{settings.LEARNNOV_SITE_URL}/?ref={referral.code}"
        })


class StudentSummaryView(APIView):
    """ملخص سريع للطالب: طلبات، نقاط، شهادات."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # الطلبات النشطة
        active_apps = ProgramApplication.objects.filter(
            applicant=user, 
            status__in=['submitted', 'under_review']
        ).count()
        
        # نقاط الإحالة
        referral, _ = UserReferral.generate_code_for_user(user)
        
        # الشهادات (من نظام edX الأصلي)
        from lms.djangoapps.certificates.models import GeneratedCertificate, CertificateStatuses
        certs_count = GeneratedCertificate.objects.filter(
            user=user, 
            status=CertificateStatuses.downloadable
        ).count()
        
        return Response({
            'active_applications': active_apps,
            'referral_points': referral.points,
            'certificates_earned': certs_count,
            'full_name': user.get_full_name() or user.username
        })


class ApplicationReviewView(generics.UpdateAPIView):
    """مراجعة وتحديث حالة الطلب (للمشرفين وموظفي المؤسسة)."""
    serializer_class = ApplicationReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsProviderStaff]
    queryset = ProgramApplication.objects.all()
    http_method_names = ['patch']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return ProgramApplication.objects.all()
        # السماح لموظفي الجامعة بمراجعة الطلبات الخاصة بجامعتهم فقط
        if hasattr(user, 'university') and user.university and user.university.provider:
            return ProgramApplication.objects.filter(program__provider=user.university.provider)
        return ProgramApplication.objects.none()


# --- Provider Portal ---

class ProviderProgramsView(generics.ListAPIView):
    """برامج المؤسسة للمشرف — محمية ضد الوصول غير المصرح به."""
    serializer_class = AcademicProgramListSerializer
    permission_classes = [permissions.IsAuthenticated, IsProviderStaff]

    def get_queryset(self):
        slug = self.kwargs['slug']
        user = self.request.user
        
        # إذا لم يكن سوبر أدمن، نتحقق من صلته بالجامعة
        if not user.is_staff:
            provider = get_object_or_404(ProgramProvider, slug=slug)
            if not (hasattr(user, 'university') and user.university and user.university.provider == provider):
                return AcademicProgram.objects.none()

        return AcademicProgram.objects.filter(
            provider__slug=slug
        ).select_related('provider', 'field_of_study')


class ProviderApplicationsView(generics.ListAPIView):
    """طلبات التقديم لمؤسسة معينة — محمية أمنياً ضد IDOR."""
    serializer_class = ProgramApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsProviderStaff]

    def get_queryset(self):
        slug = self.kwargs['slug']
        user = self.request.user
        
        # التحقق الصارم من الصلاحية
        if not user.is_staff:
            provider = get_object_or_404(ProgramProvider, slug=slug)
            # التحقق عبر العلاقة المباشرة أو البريد الإلكتروني (كسياج أمان إضافي)
            is_owner = (hasattr(user, 'university') and user.university and user.university.provider == provider)
            is_contact = (provider.contact_email == user.email)
            
            if not (is_owner or is_contact):
                return ProgramApplication.objects.none()

        return ProgramApplication.objects.filter(
            program__provider__slug=slug
        ).select_related('program', 'applicant').order_by('-submitted_at')


class ProviderDashboardView(generics.RetrieveAPIView):
    """
    لوحة تحكم إحصائية لمزود البرنامج (الجامعة).
    """
    permission_classes = [permissions.IsAuthenticated, IsProviderStaff]
    
    def get(self, request, *args, **kwargs):
        slug = self.kwargs.get('slug')
        provider = get_object_or_404(ProgramProvider, slug=slug)
        
        # التأكد من أن المستخدم يملك صلاحية الوصول لهذه الجامعة
        self.check_object_permissions(request, provider)
        
        programs = AcademicProgram.objects.filter(provider=provider)
        applications = ProgramApplication.objects.filter(program__provider=provider)
        
        from django.db.models import Count, Sum
        
        stats = {
            'provider_name': provider.name,
            'total_programs': programs.count(),
            'total_applications': applications.count(),
            'total_views': programs.aggregate(Sum('views_count'))['views_count__sum'] or 0,
            'application_status_breakdown': list(
                applications.values('status').annotate(count=Count('id'))
            ),
            'top_programs': list(
                programs.order_by('-applications_count')[:5].values('title', 'applications_count', 'views_count')
            )
        }
        return Response(stats)


class GlobalInsightsView(APIView):
    """
    رؤية تحليلية شاملة للمشرفين على المنصة (Supervisors).
    تقدم بيانات معمقة حول الأداء الأكاديمي، النمو، والتوزيع الجغرافي.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.db.models import Count, Avg, Sum
        from django.db.models.functions import TruncDay
        from lms.djangoapps.learnnov_exams.models import ExamAttempt
        from .models import UserReferral, ProgramProvider, AcademicProgram, ProgramApplication
        from django.utils import timezone
        import datetime

        # 1. تحليل التحويل (Conversion Funnel)
        total_views = AcademicProgram.objects.aggregate(Sum('views_count'))['views_count__sum'] or 0
        total_apps = ProgramApplication.objects.count()
        accepted_apps = ProgramApplication.objects.filter(status='accepted').count()

        # 2. الأداء الأكاديمي (Mock Exams Analysis)
        avg_exam_score = ExamAttempt.objects.filter(is_completed=True).aggregate(Avg('score'))['score__avg'] or 0
        total_exams_taken = ExamAttempt.objects.filter(is_completed=True).count()

        # 3. توزيع الجنسيات (أكثر 5 جنسيات تقديماً)
        nationality_stats = list(
            ProgramApplication.objects.exclude(nationality='')
            .values('nationality')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        # 4. متصدرو الإحالات (Referral Leaderboard)
        top_referrers = list(
            UserReferral.objects.select_related('user')
            .order_by('-total_referred')[:5]
            .values('user__username', 'total_referred', 'points')
        )

        # 5. تحليل النمو (آخر 30 يوم)
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        daily_growth = list(
            ProgramApplication.objects.filter(submitted_at__gte=thirty_days_ago)
            .annotate(day=TruncDay('submitted_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        
        # تحويل التاريخ لسلسلة نصية للتوافق مع JSON
        for entry in daily_growth:
            if entry['day']:
                entry['day'] = entry['day'].strftime('%Y-%m-%d')

        data = {
            'overview': {
                'total_views': total_views,
                'total_applications': total_apps,
                'accepted_applications': accepted_apps,
                'conversion_rate': round((total_apps / total_views * 100), 2) if total_views > 0 else 0,
                'total_providers': ProgramProvider.objects.count(),
                'total_programs': AcademicProgram.objects.count(),
            },
            'academic_performance': {
                'average_mock_score': round(avg_exam_score, 2),
                'total_exams_completed': total_exams_taken
            },
            'university_performance': list(
                ProgramProvider.objects.annotate(
                    prog_count=Count('programs', distinct=True),
                    app_count=Count('programs__applications', distinct=True)
                ).order_by('-app_count')[:10].values('name', 'prog_count', 'app_count')
            ),
            'demographics': nationality_stats,
            'referral_leaderboard': top_referrers,
            'recent_growth_trend': daily_growth
        }
        return Response(data)


class ExportApplicationsCSVView(APIView):
    """تصدير طلبات التقديم لملف CSV (للمشرفين أو موظفي المؤسسة)."""
    permission_classes = [permissions.IsAuthenticated, IsProviderStaff]

    def get(self, request):
        import csv
        from django.http import HttpResponse
        
        # تصفية الطلبات بناءً على الصلاحيات
        if request.user.is_staff:
            apps = ProgramApplication.objects.all()
        elif hasattr(request.user, 'university') and request.user.university and request.user.university.provider:
            apps = ProgramApplication.objects.filter(program__provider=request.user.university.provider)
        else:
            return Response({"error": "No permission to export"}, status=status.HTTP_403_FORBIDDEN)
            
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="applications_export.csv"'
        # إضافة Byte Order Mark (BOM) لضمان عرض الحروف العربية بشكل صحيح في Excel
        response.write(u'\ufeff'.encode('utf8'))
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'البرنامج', 'اسم المتقدم', 'البريد الإلكتروني', 
            'الحالة', 'الجنسية', 'المعدل', 'تاريخ التقديم'
        ])
        
        for app in apps.select_related('program', 'applicant'):
            # حماية ضد CSV Injection
            row = [
                app.id, app.program.title, app.full_name or app.applicant.username,
                app.applicant.email, app.get_status_display(), app.nationality,
                app.gpa, app.submitted_at.strftime('%Y-%m-%d %H:%M')
            ]
            sanitized_row = [f"'{val}" if str(val).startswith(('=', '+', '-', '@')) else val for val in row]
            writer.writerow(sanitized_row)
            
        return response


class RecommendedProgramsView(generics.ListAPIView):
    """محرك توصيات متطور بناءً على اهتمامات الطالب وسلوكه."""
    serializer_class = AcademicProgramListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        import random
        from django.db.models import Case, When

        # 1. جلب بيانات الطالب (الطلبات السابقة)
        user_apps = ProgramApplication.objects.filter(applicant=user)
        applied_fields = set(user_apps.values_list('program__field_of_study_id', flat=True))
        applied_degrees = set(user_apps.values_list('program__degree_level', flat=True))
        already_applied_ids = set(user_apps.values_list('program_id', flat=True))

        # 2. جلب عينة من البرامج النشطة (بدلاً من جلب الكل لتجنب مشاكل الذاكرة)
        programs = AcademicProgram.objects.filter(
            status='active', is_active=True
        ).exclude(id__in=already_applied_ids).select_related('provider', 'field_of_study').order_by('-views_count')[:100]

        if not programs.exists():
            # إذا لم يكن هناك برامج جديدة، نقترح البرامج الأكثر مشاهدة
            return AcademicProgram.objects.filter(status='active', is_active=True).order_by('-views_count')[:6]

        # 3. نظام النقاط (Scoring System)
        scored_programs = []
        for p in programs:
            score = 0.0
            
            # تطابق المجال الدراسي (الأهمية القصوى)
            if p.field_of_study_id in applied_fields:
                score += 40
            
            # تطابق الدرجة العلمية
            if p.degree_level in applied_degrees:
                score += 25
            
            # البرامج المميزة (Featured)
            if p.is_featured:
                score += 20
            
            # الشعبية (تحويل المشاهدات إلى نقاط - بحد أقصى 15)
            score += min(15, p.views_count / 100.0)
            
            # التنوع (إضافة عنصر عشوائي بسيط لضمان تجدد النتائج)
            score += random.uniform(-5, 5)
            
            scored_programs.append((p, score))

        # 4. الترتيب حسب النتيجة الأعلى واختيار أفضل 6
        scored_programs.sort(key=lambda x: x[1], reverse=True)
        top_programs = scored_programs[:6]
        pk_list = [item[0].id for item in top_programs]

        if not pk_list:
            return AcademicProgram.objects.none()

        # 5. إرجاع QuerySet مرتبة للمحافظة على توافق DRF
        preserved = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(pk_list)])
        return AcademicProgram.objects.filter(id__in=pk_list).order_by(preserved)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def program_stats(request):
    """إحصاءات عامة للبرامج — مع تفعيل الكاش لتحسين الأداء."""
    from django.core.cache import cache
    from django.utils import timezone
    
    cache_key = 'learnnov_program_stats'
    stats = cache.get(cache_key)
    
    if stats is None:
        from django.db.models import Count
        stats = {
            'total_programs': AcademicProgram.objects.filter(status='active').count(),
            'total_providers': ProgramProvider.objects.filter(is_active=True).count(),
            'total_applications': ProgramApplication.objects.count(),
            'programs_by_degree': list(
                AcademicProgram.objects.filter(status='active')
                .values('degree_level')
                .annotate(count=Count('id'))
            ),
            'programs_by_field': list(
                AcademicProgram.objects.filter(status='active')
                .values('field_of_study__name')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            ),
            'updated_at': timezone.now().isoformat()
        }
        cache.set(cache_key, stats, 3600)  # كاش لمدة ساعة واحدة
        
    return Response(stats)


