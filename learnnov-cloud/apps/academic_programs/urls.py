from django.urls import path
from . import views

app_name = 'academic_programs'

urlpatterns = [
    path('fields/', views.FieldOfStudyListView.as_view(), name='fields-list'),
    path('providers/', views.ProviderListView.as_view(), name='providers-list'),
    path('providers/<slug:slug>/', views.ProviderDetailView.as_view(), name='provider-detail'),
    path('programs/', views.ProgramListView.as_view(), name='programs-list'),
    path('programs/<slug:slug>/', views.ProgramDetailView.as_view(), name='program-detail'),
    path('programs/<slug:slug>/apply/', views.ProgramApplyView.as_view(), name='program-apply'),
    path('applications/', views.MyApplicationsView.as_view(), name='my-applications'),
    path('applications/<int:pk>/', views.ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/<int:pk>/review/', views.ApplicationReviewView.as_view(), name='application-review'),
    path('summary/', views.StudentSummaryView.as_view(), name='student-summary'),
    path('stats/', views.program_stats, name='stats'),
    path('programs/<slug:slug>/syllabus/', views.ProgramSyllabusView.as_view(), name='program-syllabus'),
    path('programs/create/', views.ProgramCreateView.as_view(), name='program-create'),
    path('programs/<slug:slug>/modules/', views.ModuleListCreateView.as_view(), name='module-list-create'),
    path('modules/<int:pk>/', views.ModuleUpdateDeleteView.as_view(), name='module-detail'),
    path('modules/<int:pk>/lessons/', views.LessonListCreateView.as_view(), name='lesson-list-create'),
    path('lessons/<int:pk>/', views.LessonUpdateDeleteView.as_view(), name='lesson-detail'),
]
