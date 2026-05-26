from django.urls import path
from . import views

app_name = 'learnnov_ai_tutor'

urlpatterns = [
    path('chat/', views.ChatView.as_view(), name='chat'),
]
