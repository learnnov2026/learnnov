import os
import django
from django.test.client import RequestFactory
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.ai_assistant.views import SecurityAdvisorView

User = get_user_model()

def test_advisor():
    # Create a superuser for testing
    user, created = User.objects.get_or_create(username='admin_test', is_staff=True, is_superuser=True)
    
    # We need a dummy OPENAI_API_KEY. Since we don't have a real one, it will fail unless we mock it or actually test it.
    # Wait, does the system have OPENAI_API_KEY set? Let's check.
    if not os.getenv('OPENAI_API_KEY'):
        print("OPENAI_API_KEY is not set. We expect a 503 error.")
    
    factory = RequestFactory()
    request = factory.post('/api/ai/security-advisor/', {'scenario': 'لدينا مشكلة وصول غير مصرح للمقررات المدفوعة'}, content_type='application/json')
    request.user = user

    view = SecurityAdvisorView.as_view()
    response = view(request)

    print(f"Status Code: {response.status_code}")
    print(f"Response Data: {response.data}")

if __name__ == '__main__':
    test_advisor()
