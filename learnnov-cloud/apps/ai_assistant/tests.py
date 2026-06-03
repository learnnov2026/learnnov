from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
import os

from apps.ai_assistant.models import ChatMessage

User = get_user_model()

@override_settings(STATICFILES_STORAGE='django.contrib.staticfiles.storage.StaticFilesStorage')
class AIAssistantTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='aiuser', password='password123')
        self.client.force_authenticate(user=self.user)
        
        # Set dummy OpenAI Key for testing
        os.environ['OPENAI_API_KEY'] = 'mock-key'

    @patch('apps.ai_assistant.views.OpenAI')
    def test_chatbot_view_saves_message_and_returns_reply(self, mock_openai):
        # Setup mock OpenAI response
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "هذا رد تجريبي للمساعد الذكي"
        mock_client.chat.completions.create.return_value = mock_response

        url = reverse('ai-chat')
        data = {'message': 'كيف حالك؟'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reply'], "هذا رد تجريبي للمساعد الذكي")

        # Verify messages are saved in database
        self.assertEqual(ChatMessage.objects.filter(user=self.user).count(), 2)
        user_msg = ChatMessage.objects.filter(user=self.user, role='user').first()
        bot_msg = ChatMessage.objects.filter(user=self.user, role='assistant').first()
        self.assertIsNotNone(user_msg)
        self.assertEqual(user_msg.content, 'كيف حالك؟')
        self.assertIsNotNone(bot_msg)
        self.assertEqual(bot_msg.content, 'هذا رد تجريبي للمساعد الذكي')

    def test_chat_history_retrieval(self):
        # Create some historical messages
        ChatMessage.objects.create(user=self.user, role='user', content='سؤالي الأول')
        ChatMessage.objects.create(user=self.user, role='assistant', content='إجابتي الأولى')

        url = reverse('ai-chat-history')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['role'], 'user')
        self.assertEqual(response.data[0]['content'], 'سؤالي الأول')
        self.assertEqual(response.data[1]['role'], 'assistant')
        self.assertEqual(response.data[1]['content'], 'إجابتي الأولى')
