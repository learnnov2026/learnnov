from django.urls import path
from . import views

app_name = 'learnnov_marketing'

urlpatterns = [
    path('', views.index, name='index'),
    path('insights/', views.admin_insights, name='admin-insights'),
    path('programs/<slug:slug>/', views.program_detail, name='program-detail'),
]
