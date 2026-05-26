from django.urls import path
from . import views

app_name = 'university_ads'

urlpatterns = [
    # Active ads and universities listings
    path('', views.AdListView.as_view(), name='ad-list'),
    path('universities/', views.UniversityListView.as_view(), name='university-list'),
    
    # Analytics metrics tracking
    path('<int:ad_id>/impression/', views.TrackImpressionAPIView.as_view(), name='track-impression'),
    path('<int:ad_id>/click/', views.TrackClickAPIView.as_view(), name='track-click'),
]
