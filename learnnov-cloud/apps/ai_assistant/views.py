import os
from rest_framework.views import APIView
from django.views.generic import TemplateView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from openai import OpenAI

class ChatbotView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        user_message = request.data.get('message')
        if not user_message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return Response(
                {"error": "AI Assistant is not configured on the server yet."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            client = OpenAI(api_key=api_key)
            
            from apps.academic_programs.models import ProgramApplication
            from apps.learnnov_exams.models import ExamAttempt
            
            if request.user.is_authenticated:
                enrollments = ProgramApplication.objects.filter(applicant=request.user, status__in=['approved', 'enrolled'])
                course_names = [e.program.title for e in enrollments]
                
                attempts = ExamAttempt.objects.filter(user=request.user, is_completed=True).select_related('exam').order_by('-start_time')[:3]
                exam_info = [f"Exam: {a.exam.title}, Score: {a.score}" for a in attempts]
                
                student_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            else:
                student_name = "طالب ليرنوف المتميز"
                course_names = ["الأمن السيبراني المتقدم", "تطوير تطبيقات الويب"]
                exam_info = ["Exam: أساسيات البرمجة, Score: 95.0"]
            context_text = f"Student Name: {student_name}\n"
            if course_names:
                context_text += f"Enrolled Courses: {', '.join(course_names)}\n"
            if exam_info:
                context_text += f"Recent Exam Results: {', '.join(exam_info)}\n"

            system_prompt = (
                "أنت مساعد تعليمي ذكي لمنصة LearnNov التعليمية. أجب بأدب وباختصار باللغة العربية.\n"
                f"أنت تتحدث حالياً مع هذا الطالب المحدد. إليك بياناته الأكاديمية الحالية:\n{context_text}\n"
                "استخدم هذه المعلومات لتقديم نصائح مخصصة، دعم، وإجابات دقيقة بناءً على مستواه والمقررات التي يدرسها. "
                "لا تقم بسرد هذه المعلومات للطالب إلا إذا دعت الحاجة أو سأل عنها."
            )
            # -------------------

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            reply = response.choices[0].message.content
            return Response({"reply": reply}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SecurityAdvisorView(APIView):
    """
    مستشار الأمان التفاعلي:
    يستقبل سيناريوهات أمنية من مدراء النظام ويحللها مقدماً الحلول المناسبة
    باستخدام نموذج GPT-4 المتقدم.
    """
    # Requires staff privileges to access the security advisor
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"error": "غير مصرح. مستشار الأمان متاح فقط لمسؤولي النظام."},
                status=status.HTTP_403_FORBIDDEN
            )

        scenario = request.data.get('scenario')
        if not scenario:
            return Response({"error": "Scenario is required."}, status=status.HTTP_400_BAD_REQUEST)

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return Response(
                {"error": "OpenAI API key is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        system_prompt = (
            "أنت 'مستشار الأمان التفاعلي' لمنصة LearnNov التعليمية. "
            "أنت خبير محترف في الأمن السيبراني (Cybersecurity Expert). "
            "مهمتك هي تحليل المشاكل الأمنية التي يعرضها مدير النظام "
            "(مثل وصول غير مصرح، نظام الصلاحيات، ثغرات المدفوعات، أمان الاختبارات) "
            "وتقديم تحليل دقيق وشامل، مع اقتراح حلول برمجية وهندسية واضحة (Code examples/Architecture). "
            "أجب دائماً باللغة العربية بطريقة احترافية ومنسقة باستخدام تنسيق Markdown بشكل سليم. "
            "عند كتابة أكواد برمجية أو إعدادات، تأكد من استخدام (Code Blocks) الخاصة بـ Markdown مع تحديد لغة البرمجة (مثل ```python أو ```bash)."
        )

        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": scenario}
                ]
            )
            analysis = response.choices[0].message.content
            return Response({"analysis": analysis}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SecurityAdvisorUIPage(TemplateView):
    template_name = "ai_assistant/security_advisor.html"
