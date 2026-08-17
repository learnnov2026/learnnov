from django.urls import path

from . import views

app_name = 'university_ads'

urlpatterns = [
    path('ads/', views.active_ads, name='active_ads'),
    path('ads/<int:ad_id>/impression/', views.track_impression, name='track_impression'),
    path('ads/<int:ad_id>/click/', views.track_click, name='track_click'),
]
