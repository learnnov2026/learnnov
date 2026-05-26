from django.contrib import admin
from .models import MockExam, Question, Choice, ExamAttempt, StudentAnswer

class ChoiceInline(admin.TabularInline):
    model = Choice

class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]

admin.site.register(MockExam)
admin.site.register(Question, QuestionAdmin)
admin.site.register(ExamAttempt)
admin.site.register(StudentAnswer)
