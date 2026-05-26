import os
from django.conf import settings
from django.http import HttpResponse, Http404, HttpResponseForbidden
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from apps.academic_programs.models import ProgramApplication

class SecureMediaView(LoginRequiredMixin, View):
    """
    Secure Media Gateway:
    Validates that the user requesting the file is actively enrolled 
    or has specific permissions before serving the content.
    """
    def get(self, request, path):
        user = request.user

        # Allow superusers and staff to view any media
        if user.is_superuser or user.is_staff:
            return self.serve_file(path)

        # Example check: is the user actively enrolled in any program?
        # In a real app, you would check if the requested file belongs to a course the user is enrolled in.
        # Here we just verify they have at least one active application or enrollment.
        is_enrolled = ProgramApplication.objects.filter(
            applicant=user, 
            status__in=['approved', 'enrolled', 'completed']
        ).exists()

        if not is_enrolled:
            return HttpResponseForbidden("غير مصرح لك بالوصول لهذا المحتوى. يرجى الاشتراك في المقرر أولاً.")

        return self.serve_file(path)

    def serve_file(self, path):
        document_root = settings.MEDIA_ROOT
        fullpath = os.path.join(document_root, path)

        if not os.path.exists(fullpath):
            raise Http404("الملف غير موجود")

        # In production, use X-Sendfile (Apache) or X-Accel-Redirect (Nginx) for performance.
        # Here we stream it directly for development purposes.
        with open(fullpath, 'rb') as f:
            response = HttpResponse(f.read())
            # Basic attempt to guess mime type
            if path.endswith('.pdf'):
                response['Content-Type'] = 'application/pdf'
            elif path.endswith('.mp4'):
                response['Content-Type'] = 'video/mp4'
            elif path.endswith('.jpg') or path.endswith('.jpeg'):
                response['Content-Type'] = 'image/jpeg'
            elif path.endswith('.png'):
                response['Content-Type'] = 'image/png'
            else:
                response['Content-Type'] = 'application/octet-stream'
                
            # Content-Disposition: inline (display in browser) vs attachment (download)
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(fullpath)}"'
            return response

from django.views.generic import TemplateView
from apps.learnnov_exams.models import ExamAttempt
from apps.learnnov_certificates.models import GeneratedCertificate

class StudentDashboardView(LoginRequiredMixin, TemplateView):
    template_name = "core/student_dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user

        active_apps = ProgramApplication.objects.filter(
            applicant=user, 
            status__in=['approved', 'enrolled']
        ).select_related('program')

        exams = ExamAttempt.objects.filter(user=user).select_related('exam').order_by('-start_time')[:5]
        certificates = GeneratedCertificate.objects.filter(user=user).select_related('program')

        context['active_courses'] = active_apps
        context['exams'] = exams
        context['certificates'] = certificates
        context['courses_count'] = active_apps.count()
        context['certificates_count'] = certificates.count()
        
        return context

from django.core.exceptions import PermissionDenied
from apps.academic_programs.models import ProgramModule

class CourseViewerView(LoginRequiredMixin, TemplateView):
    template_name = "core/course_viewer.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        course_slug = self.kwargs.get('slug')

        # Staff and Instructors bypass enrollment check
        is_enrolled = False
        if user.is_staff or user.groups.filter(name='Instructors').exists():
            is_enrolled = True
        else:
            is_enrolled = ProgramApplication.objects.filter(
                applicant=user,
                program__slug=course_slug,
                status__in=['approved', 'enrolled', 'completed']
            ).exists()

        if not is_enrolled:
            raise PermissionDenied("يجب أن تكون مشتركاً في هذا المقرر لمشاهدة محتواه.")

        program = get_object_or_404(AcademicProgram, slug=course_slug)
        modules = ProgramModule.objects.filter(program=program).prefetch_related('lessons')

        context['program'] = program
        context['modules'] = modules
        
        return context
