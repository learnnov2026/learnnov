import random
import secrets
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count

from .models import MockExam, Question, Choice, ExamAttempt, ExamActionLog, StudentAnswer
from .serializers import MockExamSerializer, QuestionSerializer, ExamAttemptSerializer

def _log_exam_action(attempt, action_type, question=None, metadata=None, request=None):
    """مساعد لتسجيل حركات الطالب لضمان مصداقية الامتحان ومنع الغش."""
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
    
    ExamActionLog.objects.create(
        attempt=attempt,
        question=question,
        action_type=action_type,
        ip_address=ip,
        metadata=metadata or {}
    )


class ExamListView(generics.ListAPIView):
    """عرض الاختبارات المتاحة لكورس معين."""
    serializer_class = MockExamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course_id')
        qs = MockExam.objects.filter(is_active=True)
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs.annotate(q_count=Count('questions'))


class StartExamView(generics.CreateAPIView):
    """بدء محاولة اختبار جديدة."""
    serializer_class = ExamAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, exam_id):
        exam = get_object_or_404(MockExam, id=exam_id, is_active=True)
        active_attempt = ExamAttempt.objects.filter(user=request.user, exam=exam, is_completed=False).first()
        if active_attempt:
            return Response({'error': 'لديك محاولة نشطة بالفعل'}, status=status.HTTP_400_BAD_REQUEST)
            
        attempt = ExamAttempt.objects.create(user=request.user, exam=exam)
        _log_exam_action(attempt, 'start', request=request)
        
        # جلب الأسئلة مع خياراتها دفعة واحدة (Prefetch)
        questions = exam.questions.all().prefetch_related('choices')
        return Response({
            'attempt_id': attempt.id,
            'time_limit': exam.time_limit_minutes,
            'questions': QuestionSerializer(questions, many=True).data
        })


class SubmitExamView(generics.UpdateAPIView):
    """تسليم الإجابات والتصحيح الآلي."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(ExamAttempt, id=attempt_id, user=request.user, is_completed=False)
        _log_exam_action(attempt, 'submit_full_exam', request=request)
        
        # حساب الوقت المستغرق وفترة السماح لمنع تسليم الإجابات بعد انتهاء الوقت
        grace_period_seconds = 60
        elapsed_seconds = (timezone.now() - attempt.start_time).total_seconds()
        limit_seconds = (attempt.exam.time_limit_minutes * 60) + grace_period_seconds
        is_severely_overdue = elapsed_seconds > limit_seconds

        if is_severely_overdue:
            # Reject submission outright to prevent time manipulation
            return Response(
                {'error': 'Exam time limit exceeded. Submission rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        answers_data = request.data.get('answers', {})
        # جلب جميع الأسئلة مع خياراتها في استعلام واحد لتجنب N+1 Queries
        questions = attempt.exam.questions.all().prefetch_related('choices')
        
        total_score = 0
        answers_to_create = []
        
        for question in questions:
            student_choice_id = answers_data.get(str(question.id))
            if student_choice_id:
                try:
                    selected_choice = next((c for c in question.choices.all() if c.id == int(student_choice_id)), None)
                    if selected_choice:
                        is_correct = selected_choice.is_correct
                        answers_to_create.append(StudentAnswer(
                            attempt=attempt, question=question,
                            selected_choice=selected_choice, is_correct=is_correct
                        ))
                        if is_correct:
                            total_score += question.points
                except (ValueError, TypeError):
                    pass
        
        from django.db import transaction
        with transaction.atomic():
            if answers_to_create:
                StudentAnswer.objects.bulk_create(answers_to_create)
                    
            attempt.score = total_score
            attempt.is_completed = True
            attempt.end_time = timezone.now()
            attempt.save()
            
        _log_exam_action(attempt, 'finish', request=request)
        
        return Response({
            'status': 'completed',
            'final_score': total_score,
            'total_points': sum(q.points for q in questions),
            'attempt_id': attempt.id
        })


class HeartbeatRateThrottle(UserRateThrottle):
    rate = '60/minute'


class ExamHeartbeatView(generics.GenericAPIView):
    """نبضات القلب للتأكد من نشاط الطالب ومتابعة المحاولة ومنع الغش."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [HeartbeatRateThrottle]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(ExamAttempt, id=attempt_id, user=request.user, is_completed=False)
        # تسجيل نبضة القلب فقط بنسبة 10% لتقليل الحمل على قاعدة البيانات
        if secrets.SystemRandom().random() < 0.1:
            _log_exam_action(attempt, 'heartbeat', request=request)
        
        remaining = (attempt.exam.time_limit_minutes * 60) - (timezone.now() - attempt.start_time).total_seconds()
        return Response({'status': 'alive', 'remaining_seconds': max(0, remaining)})


class MyExamAttemptsView(generics.ListAPIView):
    """قائمة محاولات الطالب في الاختبارات."""
    serializer_class = ExamAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExamAttempt.objects.filter(user=self.request.user).select_related('exam').order_by('-start_time')


class ExamResultDetailView(generics.RetrieveAPIView):
    """تفاصيل نتيجة اختبار محدد مع تحليل كامل للإجابات."""
    serializer_class = ExamAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExamAttempt.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # جلب الإجابات التفصيلية مع الأسئلة والخيارات المحملة مسبقاً
        answers = instance.answers.select_related('question', 'selected_choice').prefetch_related('question__choices')
        answer_data = []
        for ans in answers:
            correct_choice = next((c for c in ans.question.choices.all() if c.is_correct), None)
            answer_data.append({
                'question_text': ans.question.text,
                'selected_choice_text': ans.selected_choice.text,
                'is_correct': ans.is_correct,
                'correct_choice_text': correct_choice.text if correct_choice else None,
                'points_earned': ans.question.points if ans.is_correct else 0
            })
            
        data = serializer.data
        data['detailed_results'] = answer_data
        return Response(data)
