from rest_framework import serializers
from .models import MockExam, Question, Choice, ExamAttempt

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text'] # لا نعيد is_correct في القائمة لحماية الإجابة

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'points', 'choices']

class MockExamSerializer(serializers.ModelSerializer):
    questions_count = serializers.IntegerField(source='q_count', read_only=True)
    
    class Meta:
        model = MockExam
        fields = ['id', 'title', 'description', 'time_limit_minutes', 'questions_count']

class ExamAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAttempt
        fields = ['id', 'exam', 'score', 'start_time', 'is_completed']
        read_only_fields = ['score', 'is_completed']
