from django.urls import path
from . import views

app_name = 'learnnov_mobile_api'

urlpatterns = [
    path('user/', views.UserProfileView.as_view(), name='user-profile'),
    path('courses/', views.UserCoursesView.as_view(), name='user-courses'),
]
