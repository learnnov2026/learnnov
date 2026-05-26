import logging
from rest_framework import generics, serializers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render
from django.http import Http404, JsonResponse
from django.urls import reverse
from django.conf import settings
from django.utils.translation import get_language, get_language_bidi

from .models import CertificateQRCode, GeneratedCertificate
from .qr_utils import get_or_create_qr

log = logging.getLogger(__name__)


# ── Serializers ───────────────────────────────────────────────────────────────

class GeneratedCertificateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    student_name = serializers.SerializerMethodField()
    issue_date = serializers.SerializerMethodField()

    class Meta:
        model = GeneratedCertificate
        fields = ['verify_uuid', 'username', 'student_name', 'course_id', 'course_name', 'grade', 'status', 'issue_date']

    def get_student_name(self, obj):
        user = obj.user
        return f'{user.first_name} {user.last_name}'.strip() or user.username

    def get_issue_date(self, obj):
        return obj.created_date.strftime('%d / %m / %Y') if obj.created_date else ''


class CertificateQRCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateQRCode
        fields = '__all__'


# ── Helper functions for traditional rendering ──────────────────────────────────

def _verify_url(request, verify_uuid):
    site_url = getattr(settings, 'LEARNNOV_SITE_URL', request.build_absolute_uri('/').rstrip('/'))
    # استخدام المسار الخاص بنظام التحقق السحابي
    path = reverse('learnnov_certificates:verify_certificate_html', kwargs={'verify_uuid': verify_uuid})
    return f"{site_url.rstrip('/')}{path}"

def _lang_context(request):
    lang = get_language() or 'ar'
    return {
        'LANGUAGE_CODE': lang,
        'text_dir': 'rtl' if get_language_bidi() else 'ltr',
    }

def _get_cert_or_404(verify_uuid):
    try:
        cert = GeneratedCertificate.objects.get(verify_uuid=verify_uuid)
    except GeneratedCertificate.DoesNotExist:
        raise Http404
    if cert.status != 'downloadable':
        raise Http404
    return cert

def _parse_grade(raw):
    try:
        return str(round(float(raw) * 100))
    except (ValueError, TypeError):
        return str(raw)


# ── Traditional Views (Bilingual Template Rendering) ──────────────────────────

def render_certificate_html(request, verify_uuid):
    """
    عرض الشهادة ثنائية اللغة بصيغة HTML للطباعة أو المعاينة.
    المسار: /certificates/ar/<uuid>/
    """
    cert = _get_cert_or_404(verify_uuid)
    student_name = f'{cert.user.first_name} {cert.user.last_name}'.strip() or cert.user.username
    issue_date = cert.created_date.strftime('%d / %m / %Y') if cert.created_date else ''
    grade = _parse_grade(cert.grade)

    verification_url = _verify_url(request, verify_uuid)
    qr_obj = get_or_create_qr(verify_uuid, verification_url)
    qr_image_url = request.build_absolute_uri(qr_obj.qr_image.url) if qr_obj and qr_obj.qr_image else ''

    context = {
        'verify_uuid': verify_uuid,
        'student_name': student_name,
        'course_name': cert.course_name or cert.course_id,
        'course_org': 'LearnNov',
        'grade': grade,
        'issue_date': issue_date,
        'signatories': [],
        'qr_image_url': qr_image_url,
        'verification_url': verification_url,
        'platform_name': getattr(settings, 'PLATFORM_NAME', 'LearnNov'),
    }
    context.update(_lang_context(request))
    return render(request, 'learnnov_certificates/certificate_ar.html', context)


def verify_certificate_html(request, verify_uuid):
    """
    صفحة التحقق العامة المفتوحة للجمهور.
    المسار: /certificates/verify/<uuid>/
    """
    base_ctx = {'verify_uuid': verify_uuid, 'status': 'invalid'}
    base_ctx.update(_lang_context(request))

    try:
        cert = _get_cert_or_404(verify_uuid)
    except Http404:
        return render(request, 'learnnov_certificates/verify.html', base_ctx)

    student_name = f'{cert.user.first_name} {cert.user.last_name}'.strip() or cert.user.username
    issue_date = cert.created_date.strftime('%d / %m / %Y') if cert.created_date else ''

    base_ctx.update({
        'status': 'valid',
        'student_name': student_name,
        'course_name': cert.course_name or cert.course_id,
        'course_org': 'LearnNov',
        'issue_date': issue_date,
        'certificate_url': request.build_absolute_uri(reverse('learnnov_certificates:render_certificate_html', kwargs={'verify_uuid': verify_uuid})),
    })
    return render(request, 'learnnov_certificates/verify.html', base_ctx)


# ── REST API Views (for Vercel React frontend) ────────────────────────────────

class CertificateVerifyAPIView(APIView):
    """
    نقطة نهاية API للتحقق من صحة الشهادة وإرجاع تفاصيلها كـ JSON.
    المسار: /api/certificates/verify/<uuid>/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, verify_uuid):
        try:
            cert = GeneratedCertificate.objects.select_related('user').get(verify_uuid=verify_uuid, status='downloadable')
            serializer = GeneratedCertificateSerializer(cert)
            
            verification_url = _verify_url(request, verify_uuid)
            qr_obj = get_or_create_qr(verify_uuid, verification_url)
            qr_image_url = request.build_absolute_uri(qr_obj.qr_image.url) if qr_obj and qr_obj.qr_image else ''

            data = serializer.data
            data['is_valid'] = True
            data['qr_image_url'] = qr_image_url
            data['verification_url'] = verification_url
            data['certificate_url'] = request.build_absolute_uri(reverse('learnnov_certificates:render_certificate_html', kwargs={'verify_uuid': verify_uuid}))
            return Response(data, status=status.HTTP_200_OK)
        except GeneratedCertificate.DoesNotExist:
            return Response({
                'is_valid': False,
                'verify_uuid': verify_uuid,
                'error': 'Certificate not found or not active.'
            }, status=status.HTTP_404_NOT_FOUND)

class GenerateCertificateView(APIView):
    """
    نقطة نهاية API لإصدار شهادة جديدة.
    يجب أن يتم التحقق من نسبة إنجاز الطالب في الدورة قبل الإصدار.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({'error': 'course_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. التحقق من إتمام المقرر (Validation)
        # يمكن استدعاء خدمة خارجية (مثل Open edX API) هنا للتحقق
        # من أن الطالب قد أكمل الدورة بنجاح.
        is_completed = self.check_course_completion(request.user, course_id)
        if not is_completed:
            return Response({
                'error': 'Student has not completed the required modules or has not met the passing grade.'
            }, status=status.HTTP_403_FORBIDDEN)

        # 2. إصدار الشهادة
        import uuid
        cert, created = GeneratedCertificate.objects.get_or_create(
            user=request.user,
            course_id=course_id,
            defaults={
                'verify_uuid': str(uuid.uuid4()),
                'course_name': request.data.get('course_name', ''),
                'grade': request.data.get('grade', 'Pass'),
                'status': 'downloadable'
            }
        )

        return Response({
            'message': 'Certificate generated successfully',
            'verify_uuid': cert.verify_uuid
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def check_course_completion(self, user, course_id):
        from apps.academic_programs.models import ProgramApplication
        from apps.learnnov_exams.models import ExamAttempt

        # 1. Native LearnNov check
        # Check if they have a passing exam score for this course (assuming 50 is passing)
        passed_exam = ExamAttempt.objects.filter(
            user=user, 
            exam__course_id=course_id, 
            is_completed=True, 
            score__gte=50
        ).exists()
        
        if passed_exam:
            return True
            
        # Or check if they are officially 'accepted'
        accepted_app = ProgramApplication.objects.filter(
            applicant=user,
            program__slug=course_id,
            status='accepted'
        ).exists()
        
        if accepted_app:
            return True
        
        # 2. Open edX Check (if applicable)
        if course_id.startswith('course-v1:'):
            # Block generation until Open edX Webhook is integrated to prevent forgery
            pass

        return False
