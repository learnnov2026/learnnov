from django.urls import path
from . import views

app_name = 'program_ads'

urlpatterns = [
    # Public
    path('serve/<slug:placement_slug>/', views.serve_ad, name='serve-ad'),
    path('track/', views.record_impression, name='track'),

    # Admin
    path('placements/', views.PlacementListView.as_view(), name='placements-list'),
    path('list/', views.AdvertisementListView.as_view(), name='ads-list'),
    path('<int:pk>/', views.AdvertisementDetailView.as_view(), name='ad-detail'),
    path('<int:pk>/approve/', views.approve_ad, name='approve-ad'),
    path('<int:pk>/activate/', views.activate_ad, name='activate-ad'),
    path('<int:pk>/analytics/', views.ad_analytics, name='ad-analytics'),
    path('dashboard/', views.ads_dashboard, name='dashboard'),
]
