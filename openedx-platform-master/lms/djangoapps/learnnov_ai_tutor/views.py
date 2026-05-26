from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from .models import ChatMessage
import openai

# System prompt to guide the AI tutor behavior
SYSTEM_PROMPT = "You are a helpful AI tutor for the LearnNov platform. Provide concise, accurate, and friendly answers to student queries."

class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        course_id = request.data.get('course_id')
        message = request.data.get('message')

        if not course_id or not message:
            return Response({"error": "course_id and message are required"}, status=400)

        # Persist the incoming user message
        ChatMessage.objects.create(
            user=user,
            course_id=course_id,
            message=message,
            is_bot=False,
        )

        # Prepare OpenAI client
        openai.api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not openai.api_key:
            return Response({"error": "OpenAI API key not configured"}, status=500)

        # Retrieve the most recent 6 messages (including the newly saved one) for context
        recent_messages_qs = (
            ChatMessage.objects.filter(user=user, course_id=course_id)
            .order_by('-created_at')
            .only('message', 'is_bot')[:6]
        )
        # Reverse to chronological order (oldest -> newest)
        recent_messages = list(recent_messages_qs)[::-1]

        # Build payload for ChatCompletion
        messages_payload = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in recent_messages:
            role = "assistant" if msg.is_bot else "user"
            messages_payload.append({"role": role, "content": msg.message})

        # Call OpenAI API
        try:
            completion = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages_payload,
            )
            bot_response = completion.choices[0].message.content
        except Exception as exc:
            return Response({"error": f"OpenAI request failed: {str(exc)}"}, status=500)

        # Persist the bot response
        ChatMessage.objects.create(
            user=user,
            course_id=course_id,
            message=bot_response,
            is_bot=True,
        )

        return Response({"response": bot_response})
