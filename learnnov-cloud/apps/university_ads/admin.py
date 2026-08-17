from django.contrib import admin
from .models import University, UniversityAd, AdImpression, AdClick


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name', 'is_active', 'created_at']
    search_fields = ['name', 'name_ar']


@admin.register(UniversityAd)
class UniversityAdAdmin(admin.ModelAdmin):
    list_display = ['title_ar', 'title', 'university', 'placement', 'is_active', 'start_date', 'end_date', 'impressions_count', 'clicks_count']
    list_filter = ['is_active', 'placement', 'university']
    search_fields = ['title', 'title_ar', 'university__name', 'university__name_ar']


@admin.register(AdImpression)
class AdImpressionAdmin(admin.ModelAdmin):
    list_display = ['ad', 'user', 'ip_address', 'page', 'timestamp']
    list_filter = ['timestamp', 'page']
    search_fields = ['ad__title', 'ad__title_ar', 'user__username', 'ip_address']


@admin.register(AdClick)
class AdClickAdmin(admin.ModelAdmin):
    list_display = ['ad', 'user', 'ip_address', 'timestamp']
    list_filter = ['timestamp']
    search_fields = ['ad__title', 'ad__title_ar', 'user__username', 'ip_address']
