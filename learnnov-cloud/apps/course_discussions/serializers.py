from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DiscussionThread, DiscussionPost

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class DiscussionPostSerializer(serializers.ModelSerializer):
    author = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = DiscussionPost
        fields = ['id', 'thread', 'author', 'body', 'is_instructor_reply', 'is_accepted_answer', 'created_at']
        read_only_fields = ['author', 'is_instructor_reply', 'is_accepted_answer']

class DiscussionThreadSerializer(serializers.ModelSerializer):
    author = UserSimpleSerializer(read_only=True)
    posts = DiscussionPostSerializer(many=True, read_only=True)
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionThread
        fields = ['id', 'program', 'author', 'title', 'body', 'is_pinned', 'is_resolved', 'created_at', 'reply_count', 'posts']
        read_only_fields = ['author', 'is_pinned', 'is_resolved']

    def get_reply_count(self, obj):
        return obj.posts.count()
