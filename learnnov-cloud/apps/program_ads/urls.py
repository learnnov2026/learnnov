from django.urls import path
from . import views

app_name = 'program_ads'

urlpatterns = [
    path('serve/<slug:placement_slug>/', views.ServeAdsView.as_view(), name='serve-ads'),
    path('track/<int:ad_id>/impression/', views.TrackAdImpressionView.as_view(), name='track-impression'),
    path('track/<int:ad_id>/click/', views.TrackAdClickView.as_view(), name='track-click'),
]
