from django.contrib import admin
from .models import MockExam, Question, Choice, ExamAttempt, StudentAnswer

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 1

class StudentAnswerInline(admin.TabularInline):
    model = StudentAnswer
    extra = 0
    readonly_fields = ['question', 'selected_choice', 'is_correct']
    can_delete = False

class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]
    list_display = ['text', 'exam', 'points']
    list_filter = ['exam']
    search_fields = ['text']
    list_select_related = ['exam']

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0

class MockExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'course_id', 'time_limit_minutes', 'is_active']
    list_filter = ['is_active']
    search_fields = ['title', 'course_id']
    inlines = [QuestionInline]

class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'exam', 'score', 'is_completed', 'start_time']
    list_filter = ['is_completed', 'exam']
    readonly_fields = ['start_time', 'end_time', 'user', 'exam', 'score']
    list_select_related = ['user', 'exam']
    inlines = [StudentAnswerInline]

admin.site.register(MockExam, MockExamAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(ExamAttempt, ExamAttemptAdmin)
