import logging

from django.conf import settings
from django.http import Http404
from django.shortcuts import render
from django.utils.translation import get_language, get_language_bidi

from lms.djangoapps.certificates.models import CertificateStatuses, GeneratedCertificate
from openedx.core.djangoapps.content.course_overviews.models import CourseOverview
from opaque_keys.edx.keys import CourseKey

from .models import CertificateQRCode
from .qr_utils import get_or_create_qr

log = logging.getLogger(__name__)


def _verify_url(request, verify_uuid):
    from django.urls import reverse
    site_url = getattr(settings, 'LEARNNOV_SITE_URL', request.build_absolute_uri('/').rstrip('/'))
    path = reverse('learnnov_certificates:verify_certificate', kwargs={'verify_uuid': verify_uuid})
    return f"{site_url.rstrip('/')}{path}"


def _lang_context(request):
    """Return language-related context variables for templates."""
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
    if cert.status != CertificateStatuses.downloadable:
        raise Http404
    return cert


def _course_info(cert):
    try:
        course_key = CourseKey.from_string(str(cert.course_id))
        overview = CourseOverview.get_from_id(course_key)
        return str(overview.display_name), overview.org
    except Exception:
        return str(cert.course_id), ''


def _student_name(user):
    try:
        name = user.profile.name
        if name:
            return name
    except Exception:
        pass
    return f'{user.first_name} {user.last_name}'.strip() or user.username


def _parse_grade(raw):
    try:
        return str(round(float(raw) * 100))
    except (ValueError, TypeError):
        return ''


def render_certificate(request, verify_uuid):
    """Render the bilingual certificate. URL: /certificates/ar/<uuid>/"""
    cert = _get_cert_or_404(verify_uuid)
    course_name, course_org = _course_info(cert)
    student_name = _student_name(cert.user)
    issue_date = cert.created_date.strftime('%d / %m / %Y') if cert.created_date else ''
    grade = _parse_grade(cert.grade)

    verification_url = _verify_url(request, verify_uuid)
    qr_obj = get_or_create_qr(verify_uuid, verification_url)
    qr_image_url = request.build_absolute_uri(qr_obj.qr_image.url) if qr_obj and qr_obj.qr_image else ''

    context = {
        'verify_uuid': verify_uuid,
        'student_name': student_name,
        'course_name': course_name,
        'course_org': course_org,
        'grade': grade,
        'issue_date': issue_date,
        'signatories': [],
        'qr_image_url': qr_image_url,
        'verification_url': verification_url,
        'platform_name': getattr(settings, 'PLATFORM_NAME', 'LearnNov'),
    }
    context.update(_lang_context(request))
    return render(request, 'learnnov_certificates/certificate_ar.html', context)


def verify_certificate(request, verify_uuid):
    """Public verification page. URL: /certificates/verify/<uuid>/"""
    base_ctx = {'verify_uuid': verify_uuid, 'status': 'invalid'}
    base_ctx.update(_lang_context(request))

    try:
        cert = _get_cert_or_404(verify_uuid)
    except Http404:
        return render(request, 'learnnov_certificates/verify.html', base_ctx)

    course_name, course_org = _course_info(cert)
    student_name = _student_name(cert.user)
    issue_date = cert.created_date.strftime('%d / %m / %Y') if cert.created_date else ''

    from django.urls import reverse
    base_ctx.update({
        'status': 'valid',
        'student_name': student_name,
        'course_name': course_name,
        'course_org': course_org,
        'issue_date': issue_date,
        'certificate_url': request.build_absolute_uri(reverse('learnnov_certificates:render_certificate', kwargs={'verify_uuid': verify_uuid})),
    })
    return render(request, 'learnnov_certificates/verify.html', base_ctx)
