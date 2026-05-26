from django.contrib import admin
from .models import DiscussionThread, DiscussionPost

class DiscussionPostInline(admin.TabularInline):
    model = DiscussionPost
    extra = 1

@admin.register(DiscussionThread)
class DiscussionThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'program', 'author', 'is_pinned', 'is_resolved', 'created_at')
    list_filter = ('is_pinned', 'is_resolved', 'program')
    search_fields = ('title', 'author__username', 'program__title')
    inlines = [DiscussionPostInline]

@admin.register(DiscussionPost)
class DiscussionPostAdmin(admin.ModelAdmin):
    list_display = ('thread', 'author', 'is_instructor_reply', 'created_at')
    list_filter = ('is_instructor_reply',)
    search_fields = ('body', 'author__username')
