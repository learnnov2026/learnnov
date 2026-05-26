from django.urls import path
from . import views, health

app_name = 'academic_programs'

urlpatterns = [
    # Fields of Study
    path('fields/', views.FieldOfStudyListView.as_view(), name='fields-list'),

    # Providers
    path('providers/', views.ProviderListView.as_view(), name='providers-list'),
    path('providers/<slug:slug>/', views.ProviderDetailView.as_view(), name='provider_detail'),
    path('providers/<slug:slug>/dashboard/', views.ProviderDashboardView.as_view(), name='provider_dashboard'),
    path('providers/<slug:slug>/programs/', views.ProviderProgramsView.as_view(), name='provider_programs'),
    path('providers/<slug:slug>/applications/', views.ProviderApplicationsView.as_view(), name='provider-applications'),

    # Programs
    path('programs/', views.ProgramListView.as_view(), name='programs-list'),
    path('programs/<slug:slug>/', views.ProgramDetailView.as_view(), name='program-detail'),
    path('programs/<slug:slug>/apply/', views.ProgramApplyView.as_view(), name='program-apply-slug'),

    # Applications
    path('applications/', views.MyApplicationsView.as_view(), name='my-applications'),
    path('applications/apply/', views.ProgramApplyView.as_view(), name='program-apply'),
    path('applications/<int:pk>/review/', views.ApplicationReviewView.as_view(), name='application-review'),
    path('applications/<int:pk>/', views.ApplicationDetailView.as_view(), name='application-detail'),
    path('referral/', views.MyReferralView.as_view(), name='my-referral'),
    path('recommendations/', views.RecommendedProgramsView.as_view(), name='recommendations'),
    path('summary/', views.StudentSummaryView.as_view(), name='student-summary'),

    # Stats & Insights
    path('stats/', views.program_stats, name='stats'),
    path('insights/global/', views.GlobalInsightsView.as_view(), name='global-insights'),
    path('insights/export/applications/', views.ExportApplicationsCSVView.as_view(), name='export-applications-csv'),
    
    # Health Check
    path('health/', health.HealthCheckView.as_view(), name='health-check'),
]
