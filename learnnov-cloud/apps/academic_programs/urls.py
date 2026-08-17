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
    path('financial-aid/apply/', views.FinancialAidSubmitView.as_view(), name='financial-aid-apply'),
    path('financial-aid/my/', views.MyFinancialAidListView.as_view(), name='financial-aid-my'),
    path('financial-aid/review/', views.FinancialAidReviewListView.as_view(), name='financial-aid-review-list'),
    path('financial-aid/<int:pk>/review/', views.FinancialAidReviewView.as_view(), name='financial-aid-review'),
    path('summary/', views.StudentSummaryView.as_view(), name='student-summary'),
    path('stats/', views.program_stats, name='stats'),
    path('programs/<slug:slug>/syllabus/', views.ProgramSyllabusView.as_view(), name='program-syllabus'),
    path('programs/create/', views.ProgramCreateView.as_view(), name='program-create'),
    path('programs/<slug:slug>/modules/', views.ModuleListCreateView.as_view(), name='module-list-create'),
    path('modules/<int:pk>/', views.ModuleUpdateDeleteView.as_view(), name='module-detail'),
    path('modules/<int:pk>/lessons/', views.LessonListCreateView.as_view(), name='lesson-list-create'),
    path('lessons/<int:pk>/', views.LessonUpdateDeleteView.as_view(), name='lesson-detail'),
    path('specializations/', views.SpecializationListView.as_view(), name='specializations-list'),
    path('specializations/<slug:slug>/', views.SpecializationDetailView.as_view(), name='specialization-detail'),
    path('specializations/<slug:slug>/enroll/', views.SpecializationEnrollView.as_view(), name='specialization-enroll'),
    path('peer-assignments/submit/', views.PeerSubmissionCreateView.as_view(), name='peer-submission-submit'),
    path('peer-reviews/submit/', views.PeerReviewSubmitView.as_view(), name='peer-review-submit'),
    path('peer-reviews/random/', views.PeerReviewRandomGetView.as_view(), name='peer-review-random'),
    path('peer-reviews/status/', views.PeerReviewStatusView.as_view(), name='peer-review-status'),
]
