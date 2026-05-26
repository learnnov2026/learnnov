from django.urls import path
from .views import ChatbotView, SecurityAdvisorView, SecurityAdvisorUIPage

urlpatterns = [
    path('chat/', ChatbotView.as_view(), name='ai-chat'),
    path('security-advisor/', SecurityAdvisorView.as_view(), name='security-advisor-api'),
    path('security-advisor/ui/', SecurityAdvisorUIPage.as_view(), name='security-advisor-ui'),
]
