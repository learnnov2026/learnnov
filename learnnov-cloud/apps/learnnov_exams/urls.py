from django.urls import path
from . import views

app_name = 'learnnov_exams'

urlpatterns = [
    path('', views.ExamListView.as_view(), name='exam-list'),
    path('<int:exam_id>/start/', views.StartExamView.as_view(), name='exam-start'),
    path('attempts/', views.MyExamAttemptsView.as_view(), name='my-attempts'),
    path('attempts/<int:pk>/', views.ExamResultDetailView.as_view(), name='result-detail'),
    path('attempts/<int:attempt_id>/submit/', views.SubmitExamView.as_view(), name='exam-submit'),
    path('attempts/<int:attempt_id>/heartbeat/', views.ExamHeartbeatView.as_view(), name='exam-heartbeat'),
]
