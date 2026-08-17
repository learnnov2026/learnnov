from django.urls import path
from . import views

app_name = 'learnnov_b2b'

urlpatterns = [
    path('dashboard/', views.EnterpriseDashboardView.as_view(), name='dashboard'),
    path('learners/', views.CompanyLearnersView.as_view(), name='learners'),
]
