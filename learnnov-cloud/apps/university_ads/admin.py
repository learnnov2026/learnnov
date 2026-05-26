from django.contrib import admin
from .models import University, UniversityAd


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_ar', 'is_active']
    search_fields = ['name', 'name_ar']


@admin.register(UniversityAd)
class UniversityAdAdmin(admin.ModelAdmin):
    list_display = ['title', 'university', 'placement', 'is_active', 'start_date', 'end_date', 'impressions_count']
    list_filter = ['is_active', 'placement']
