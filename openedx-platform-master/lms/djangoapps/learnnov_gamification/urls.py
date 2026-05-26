from django.urls import path
from . import views

app_name = 'learnnov_gamification'

urlpatterns = [
    path('profile/', views.UserProfileGamificationView.as_view(), name='profile'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
]
