import os
from rest_framework.views import APIView
from django.views.generic import TemplateView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from openai import OpenAI
from .models import ChatMessage

class ChatbotView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'ai_chat'

    def post(self, request, *args, **kwargs):
        user_message = request.data.get('message')
        if not user_message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            msg_lower = user_message.lower()
            if "شبك" in msg_lower or "rnn" in msg_lower or "deep" in msg_lower:
                reply = (
                  "أهلاً بك يا بطل! بخصوص تساؤلك حول الشبكات العصبية العميقة وتلاشي التدرج (Vanishing Gradient):\n\n"
                  "تعتبر مشكلة تلاشي التدرج شائعة في شبكات RNN البسيطة عند تدريبها على سلاسل طويلة. "
                  "الحل الأمثل هو الانتقال إلى شبكات **LSTM** أو **GRU** لأنها تحتوي على بوابات تحكم (Gates) تتيح تمرير المعلومات عبر فترات زمنية طويلة دون تلاشي.\n\n"
                  "إليك مثال بسيط لبناء طبقة LSTM باستخدام مكتبة TensorFlow:\n\n"
                  "```python\n"
                  "import tensorflow as tf\n\n"
                  "# بناء نموذج يحتوي على طبقة LSTM\n"
                  "model = tf.keras.Sequential([\n"
                  "    tf.keras.layers.Embedding(input_dim=1000, output_dim=64),\n"
                  "    tf.keras.layers.LSTM(units=128, return_sequences=False),\n"
                  "    tf.keras.layers.Dense(units=10, activation='softmax')\n"
                  "])\n"
                  "```\n\n"
                  "أتمنى أن يساعدك هذا المثال في تطبيقك الأكاديمي!"
                )
            elif "تشفير" in msg_lower or "aes" in msg_lower or "أمن" in msg_lower:
                reply = (
                  "أهلاً بك! بالنسبة لسؤالك حول معايير التشفير AES-256 وحوكمة المفاتيح:\n\n"
                  "تعتبر خوارزمية **AES-256** هي المعيار الذهبي لتشفير البيانات الحساسة أثناء التخزين (Data at Rest). "
                  "لإدارة المفاتيح وتدويرها (Key Rotation) بأمان ودون التأثير على أداء النظام، يُنصح باستخدام خدمات مخصصة مثل:\n"
                  "1. **AWS KMS** (Key Management Service)\n"
                  "2. **HashiCorp Vault**\n\n"
                  "تأكد دائماً من فصل صلاحيات التشفير عن صلاحيات قراءة البيانات المشفرة لزيادة الأمان."
                )
            else:
                reply = (
                  "أهلاً بك! أنا مساعد ليرنوف الأكاديمي الذكي (في وضع المحاكاة المحلي).\n\n"
                  "يمكنني مساعدتك في استفساراتك البرمجية، شرح المفاهيم المعقدة، ومراجعة مناهجك الدراسية. "
                  "اطرح سؤالك وسأجيبك فوراً!"
                )
            if user:
                ChatMessage.objects.create(user=user, role='user', content=user_message)
                ChatMessage.objects.create(user=user, role='assistant', content=reply)
            return Response({"reply": reply}, status=status.HTTP_200_OK)

        try:
            # 1. حفظ رسالة المستخدم في قاعدة البيانات
            if user:
                ChatMessage.objects.create(user=user, role='user', content=user_message)

            client = OpenAI(api_key=api_key, timeout=10.0)
            
            from apps.academic_programs.models import ProgramApplication
            from apps.learnnov_exams.models import ExamAttempt
            
            if user:
                enrollments = ProgramApplication.objects.filter(applicant=user, status__in=['approved', 'enrolled'])
                course_names = [e.program.title for e in enrollments]
                
                attempts = ExamAttempt.objects.filter(user=user, is_completed=True).select_related('exam').order_by('-start_time')[:3]
                exam_info = [f"Exam: {a.exam.title}, Score: {a.score}" for a in attempts]
                
                student_name = f"{user.first_name} {user.last_name}".strip() or user.username
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

            # 2. تحميل آخر 10 رسائل من سجل المحادثة كـ Context لـ OpenAI
            openai_messages = [{"role": "system", "content": system_prompt}]
            if user:
                history_msgs = ChatMessage.objects.filter(user=user).order_by('-created_at')[:10]
                # إعادتها للترتيب التاريخي الصحيح (الأقدم فالأحدث)
                history_msgs = list(reversed(history_msgs))
                for msg in history_msgs[:-1]:  # نستثني الرسالة الأخيرة المضافة للتو
                    openai_messages.append({"role": msg.role, "content": msg.content})

            # إضافة الرسالة الحالية
            openai_messages.append({"role": "user", "content": user_message})

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=openai_messages
            )
            reply = response.choices[0].message.content

            # 3. حفظ إجابة المساعد الذكي في قاعدة البيانات
            if user:
                ChatMessage.objects.create(user=user, role='assistant', content=reply)

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
            client = OpenAI(api_key=api_key, timeout=10.0)
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


class ChatHistoryView(APIView):
    """جلب سجل المحادثات للمستعمل الحالي."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        messages = ChatMessage.objects.filter(user=user).order_by('created_at')[:50]
        data = []
        for msg in messages:
            data.append({
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        return Response(data)

