import os
import datetime
from rest_framework.views import APIView
from django.views.generic import TemplateView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from openai import OpenAI
from .models import ChatMessage
from apps.core.mongodb import get_mongodb_database

def save_chat_message(user, role, content):
    """حفظ الرسالة باستخدام MongoDB إذا كانت مهيأة، أو التراجع لـ SQL."""
    db = get_mongodb_database()
    if db is not None:
        try:
            db.chat_messages.insert_one({
                "user_id": user.id if user else None,
                "role": role,
                "content": content,
                "created_at": datetime.datetime.utcnow()
            })
            return True
        except Exception:
            pass
    # التراجع لقاعدة البيانات العلاقية
    ChatMessage.objects.create(user=user, role=role, content=content)
    return False

def get_chat_history(user, limit=10, reverse_order=False):
    """جلب سجل المحادثات من MongoDB أو التراجع لـ SQL."""
    db = get_mongodb_database()
    if db is not None:
        try:
            cursor = db.chat_messages.find({"user_id": user.id if user else None}).sort("created_at", -1 if reverse_order else 1).limit(limit)
            history = list(cursor)
            res = []
            for doc in history:
                res.append({
                    "role": doc.get("role"),
                    "content": doc.get("content"),
                    "timestamp": doc.get("created_at")
                })
            return res
        except Exception:
            pass
    # التراجع لقاعدة البيانات العلاقية
    history_msgs = ChatMessage.objects.filter(user=user).order_by('-created_at' if reverse_order else 'created_at')[:limit]
    res = []
    for msg in history_msgs:
        res.append({
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.created_at
        })
    return res

class ChatbotView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'ai_chat'

    def post(self, request, *args, **kwargs):
        user_message = request.data.get('message')
        lesson_id = request.data.get('lesson_id')
        if not user_message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        
        # Load lesson context if provided
        lesson_context = ""
        lesson_obj = None
        if lesson_id:
            from apps.academic_programs.models import ProgramLesson
            try:
                lesson_obj = ProgramLesson.objects.select_related('module__program').get(id=lesson_id)
                lesson_context = (
                    f"معلومات الدرس الحالي الذي يتابعه الطالب الآن:\n"
                    f"- المقرر: {lesson_obj.module.program.title}\n"
                    f"- الوحدة الدراسية: {lesson_obj.module.title}\n"
                    f"- عنوان الدرس: {lesson_obj.title}\n"
                    f"- نوع الدرس: {lesson_obj.get_lesson_type_display()}\n"
                )
                if lesson_obj.content:
                    lesson_context += f"- المحتوى الدراسي للدرس: {lesson_obj.content[:800]}\n"
            except ProgramLesson.DoesNotExist:
                pass

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            msg_lower = user_message.lower()
            if lesson_obj:
                reply = (
                    f"أهلاً بك يا بطل! بخصوص استفسارك أثناء دراستك لدرس '**{lesson_obj.title}**' في مقرر '{lesson_obj.module.program.title}':\n\n"
                    f"الدرس الحالي يركز على مفاهيم {lesson_obj.title}. يمكنني مساعدتك في توضيح هذه المفاهيم، تقديم أمثلة برمجية أو شرح إضافي لـ {lesson_obj.module.title} لمساعدتك على استيعاب المادة. يرجى توضيح سؤالك بالتحديد!"
                )
            elif "شبك" in msg_lower or "rnn" in msg_lower or "deep" in msg_lower:
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
                save_chat_message(user, 'user', user_message)
                save_chat_message(user, 'assistant', reply)
            return Response({"reply": reply}, status=status.HTTP_200_OK)

        try:
            # 1. حفظ رسالة المستخدم في قاعدة البيانات
            if user:
                save_chat_message(user, 'user', user_message)

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
            
            if lesson_context:
                context_text += f"\n{lesson_context}\n"

            system_prompt = (
                "أنت مساعد تعليمي ذكي لمنصة LearnNov التعليمية. أجب بأدب وباختصار باللغة العربية.\n"
                f"أنت تتحدث حالياً مع هذا الطالب المحدد. إليك بياناته الأكاديمية وسياق الدرس الحالي:\n{context_text}\n"
                "استخدم هذه المعلومات لتقديم نصائح مخصصة، دعم، وإجابات دقيقة بناءً على مستواه والمقررات التي يدرسها والسياق الحالي للدرس الذي يشاهده الآن. "
                "لا تقم بسرد هذه المعلومات للطالب إلا إذا دعت الحاجة أو سأل عنها."
            )

            # 2. تحميل آخر 10 رسائل من سجل المحادثة كـ Context لـ OpenAI
            openai_messages = [{"role": "system", "content": system_prompt}]
            if user:
                history_msgs = get_chat_history(user, limit=10)
                for msg in history_msgs[:-1]:  # نستثني الرسالة الأخيرة المضافة للتو
                    openai_messages.append({"role": msg["role"], "content": msg["content"]})

            # إضافة الرسالة الحالية
            openai_messages.append({"role": "user", "content": user_message})

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=openai_messages
            )
            reply = response.choices[0].message.content

            # 3. حفظ إجابة المساعد الذكي في قاعدة البيانات
            if user:
                save_chat_message(user, 'assistant', reply)

            return Response({"reply": reply}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SecurityAdvisorView(APIView):
    """
    مستشار الأمان التفاعلي:
    يستقبل سيناريوهات أمنية من مدراء النظام ويحللها مقدماً الحلول المناسبة
    باستخدام نموذج GPT-4 المتقدم.
    
    الوصول مقيد بـ Staff/Superusers فقط عبر permission_classes.
    """
    # يتطلب الوصول: is_staff=True أو is_superuser=True
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, *args, **kwargs):
        scenario = request.data.get('scenario')
        if not scenario:
            return Response({"error": "Scenario is required."}, status=status.HTTP_400_BAD_REQUEST)

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            sc_lower = scenario.lower()
            if "دفع" in sc_lower or "stripe" in sc_lower or "pay" in sc_lower or "مالية" in sc_lower:
                analysis = (
                    "### 🛡️ تحليل أمان بوابة الدفع والاشتراكات (Stripe & HyperPay)\n\n"
                    "بناءً على السيناريو المعروض، إليك التحليل الأمني للتهديدات المحتملة مثل هجمات التكرار (Replay Attacks) أو التعديل على الأسعار (Price Manipulation):\n\n"
                    "#### 1. المخاطر والتهديدات:\n"
                    "* **تعديل السعر من طرف العميل (Client-Side Price Tampering):** محاولة تعديل السعر في واجهة الويب قبل إرساله للباك-إند.\n"
                    "* **السباق التزامني (Race Conditions):** محاولة تفعيل الطلب عدة مرات في نفس الوقت للحصول على اشتراك مزدوج مجاني.\n"
                    "* **عدم التحقق من صحة الدفع (Lack of Server-side Verification):** الاعتماد على استجابة الفرونت-إند لإقرار الدفع.\n\n"
                    "#### 2. الحلول الأمنية المطبقة في LearnNov:\n"
                    "* **التحقق الخادومي (Server-Side Verification):**\n"
                    "  تم إنشاء نقطة وصول `VerifyPaymentView` التي تتصل بـ Stripe مباشرة للتحقق من أن حالة الطلب `succeeded` والعملة والمبلغ متطابقان قبل تحديث قاعدة البيانات.\n"
                    "* **قفل تزامني (Idempotency / Concurrency Protection):**\n"
                    "  استخدام قفل مؤقت عبر ذاكرة التخزين المؤقت (Cache Lock) يمنع معالجة أكثر من طلب دفع لنفس المستخدم والمقرر في نفس الثانية.\n"
                    "* **جلب الأسعار آلياً (Secure Price Retrieval):**\n"
                    "  يتم احتساب السعر الكلي والخصومات آلياً في الباك-إند استناداً إلى السجل المخزن في قاعدة البيانات، وليس بناءً على المدخلات المرسلة من العميل.\n\n"
                    "```python\n"
                    "# مثال على القفل التزامني في Django لمنع معالجة الطلبات المكررة:\n"
                    "from django.core.cache import cache\n\n"
                    "lock_key = f\"lock:order:{request.user.id}:{request.data.get('course_id')}\"\n"
                    "lock_acquired = cache.add(lock_key, \"true\", timeout=15)\n"
                    "if not lock_acquired:\n"
                    "    raise Exception(\"الطلب قيد المعالجة حالياً. يرجى الانتظار.\")\n"
                    "```"
                )
            elif "رفع" in sc_lower or "ملف" in sc_lower or "upload" in sc_lower or "clamav" in sc_lower:
                analysis = (
                    "### 🛡️ تحليل أمان رفع الملفات ومكافحة البرمجيات الخبيثة (File Upload & ClamAV Validation)\n\n"
                    "السيناريو المقدم يتعلق بأمان الملفات المرفوعة وحماية النظام من ثغرات تنفيذ الأوامر عن بعد (RCE) أو رفع شفرات خبيثة.\n\n"
                    "#### 1. المخاطر والتهديدات:\n"
                    "* **رفع ملفات تنفيذية (Web Shells):** رفع ملف بامتداد `.py` أو `.php` لتنفيذ أوامر مباشرة على خوادم المنصة.\n"
                    "* **تزييف نوع الملف (MIME-type Spoofing):** تسمية ملف خبيث بامتداد مقبول مثل `.pdf` بينما محتواه الفعلي تنفيذي.\n"
                    "* **ملفات مصابة بالفيروسات (Malware):** رفع ملفات تحتوي على فيروسات قد تصيب خوادم المنصة أو أجهزة المشرفين عند فتحها.\n\n"
                    "#### 2. الحلول الهندسية المطبقة:\n"
                    "* **فحص الفيروسات عبر الشبكة (Network ClamAV Scan):**\n"
                    "  تكامل النظام مع حاوية ClamAV لفحص كل ملف مرفوع بشكل فوري عبر مقبس الشبكة (Network Socket).\n"
                    "* **التحقق من المحتوى الفعلي (Magic Number Checks):**\n"
                    "  استخدام مكتبة `filetype` لقراءة رأس الملف والتحقق من نوعه الحقيقي بدلاً من الاعتماد على الاسم فقط.\n"
                    "* **توليد أسماء عشوائية وتخزين معزول:**\n"
                    "  حفظ الملفات بأسماء مشفرة عشوائياً وتخزينها في حاويات سحابية معزولة (Google Cloud Storage) مع تعطيل تنفيذ الأوامر داخلها.\n\n"
                    "```python\n"
                    "# فحص الملفات المرفوعة ديناميكياً عبر ClamAV:\n"
                    "import clamd\n"
                    "from django.core.exceptions import ValidationError\n\n"
                    "def validate_file_infection(file):\n"
                    "    cd = clamd.ClamdNetworkSocket(host='clamav', port=3310)\n"
                    "    scan_result = cd.scan_stream(file.chunks())\n"
                    "    if scan_result and scan_result['stream'][0] == 'FOUND':\n"
                    "        raise ValidationError(\"الملف يحتوي على تهديد أمني!\")\n"
                    "```"
                )
            elif "اختبار" in sc_lower or "exam" in sc_lower or "quiz" in sc_lower or "proctor" in sc_lower:
                analysis = (
                    "### 🛡️ تحليل حماية الاختبارات ومكافحة الغش (Exam Integrity & Proctoring)\n\n"
                    "السيناريو المعروض يتعلق بأمان الامتحانات الافتراضية وحماية مصداقية الشهادات الصادرة.\n\n"
                    "#### 1. المخاطر والتهديدات:\n"
                    "* **تجاوز وقت الاختبار (Time Limit Bypass):** إرسال الإجابات بعد انتهاء الوقت المحدد للاختبار.\n"
                    "* **الغش التفاعلي (Proctoring Bypass):** تبديل النوافذ أو فتح متصفح آخر للبحث عن الإجابات أثناء الاختبار.\n"
                    "* **التلاعب بالنتائج (Score Tampering):** محاولة إرسال درجة معدلة من طرف العميل مباشرة.\n\n"
                    "#### 2. الحلول المطبقة في المنصة:\n"
                    "* **مراقبة تبديل النوافذ (Tab Focus Tracking):**\n"
                    "  تتبع فرونت-إند المنصة لحالة تركيز النافذة وإرسال تقرير فوري للباك-إند عند تبديل المستخدم للتبويب أو تصغير المتصفح.\n"
                    "* **حساب الدرجات في الباك-إند حصراً:**\n"
                    "  يتم إرسال إجابات الاختيارات المتعددة وصح/خطأ، ويقوم الباك-إند بمطابقتها وحساب الدرجة النهائية بالاعتماد على البيانات المسجلة، دون قبول أي درجات جاهزة من العميل.\n"
                    "* **التحقق من وقت المحاولة خادومياً:**\n"
                    "  يقوم الخادم بتسجيل وقت بداية المحاولة، ويرفض إرسال الإجابات إذا تجاوز الوقت الفعلي وقت البدء + زمن الاختبار المحدد."
                )
            else:
                analysis = (
                    "### 🛡️ تحليل أمني عام للنظام الاستشاري\n\n"
                    "أهلاً بك! لقد تم استلام السيناريو الأمني الخاص بك بنجاح (في وضع المحاكاة المحلي).\n\n"
                    "#### محتوى السيناريو:\n"
                    f"> {scenario}\n\n"
                    "#### التوصيات العامة لمنصة LearnNov:\n"
                    "1. تأكد من تفعيل جدار الحماية وعزل خادم قاعدة البيانات عن الإنترنت العام.\n"
                    "2. استخدم بروتوكولات HTTPS و CSP (Content Security Policy) مشددة لحماية واجهة المستخدم من هجمات XSS.\n"
                    "3. احرص على تفعيل المصادقة الثنائية (MFA) لكافة حسابات المشرفين والمدراء لمنع تسريب الصلاحيات."
                )
            return Response({"analysis": analysis}, status=status.HTTP_200_OK)

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

from django.contrib.auth.mixins import UserPassesTestMixin, LoginRequiredMixin

class SecurityAdvisorUIPage(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = "ai_assistant/security_advisor.html"

    def test_func(self):
        return self.request.user.is_staff or self.request.user.is_superuser


class ChatHistoryView(APIView):
    """جلب سجل المحادثات للمستعمل الحالي."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        history_msgs = get_chat_history(user, limit=50)
        data = []
        for msg in history_msgs:
            ts = msg.get("timestamp")
            if isinstance(ts, datetime.datetime):
                ts_str = ts.strftime('%Y-%m-%d %H:%M:%S')
            elif ts:
                ts_str = str(ts)
            else:
                ts_str = ""
            data.append({
                'role': msg.get("role"),
                'content': msg.get("content"),
                'timestamp': ts_str
            })
        return Response(data)

