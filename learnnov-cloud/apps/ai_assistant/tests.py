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

    @patch('apps.ai_assistant.views.OpenAI')
    def test_chatbot_view_with_lesson_id(self, mock_openai):
        from apps.academic_programs.models import AcademicProgram, ProgramProvider, ProgramModule, ProgramLesson
        
        provider = ProgramProvider.objects.create(name='Provider A', slug='prov-a')
        program = AcademicProgram.objects.create(
            provider=provider, title='Program A', slug='prog-a', tuition_fee=100.00,
            degree_level='diploma', status='active', is_active=True
        )
        module = ProgramModule.objects.create(program=program, title='Module A', order=1)
        lesson = ProgramLesson.objects.create(
            module=module, title='Lesson A', lesson_type='text', content='This is lesson A content', order=1
        )

        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "هذا رد يعتمد على سياق الدرس"
        mock_client.chat.completions.create.return_value = mock_response

        url = reverse('ai-chat')
        data = {'message': 'اشرح لي هذا الدرس', 'lesson_id': lesson.id}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reply'], "هذا رد يعتمد على سياق الدرس")
        
        mock_client.chat.completions.create.assert_called_once()
        call_args = mock_client.chat.completions.create.call_args[1]
        system_content = call_args['messages'][0]['content']
        self.assertIn('Lesson A', system_content)
        self.assertIn('This is lesson A content', system_content)

