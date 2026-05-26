from django.contrib import admin
from .models import UserGamificationProfile

@admin.register(UserGamificationProfile)
class UserGamificationProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_points', 'current_streak', 'longest_streak', 'last_activity_date')
    search_fields = ('user__username', 'user__email')
    list_filter = ('last_activity_date',)
    ordering = ('-total_points',)
