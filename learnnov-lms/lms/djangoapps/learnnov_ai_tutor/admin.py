from django.contrib import admin
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'course_id', 'is_bot', 'created_at')
    search_fields = ('user__username', 'user__email', 'message', 'course_id')
    list_filter = ('is_bot', 'created_at')
    readonly_fields = ('created_at',)
