from django.contrib import admin
from .models import AdPlacement, Advertisement

@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'placement_type', 'is_active']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ['title', 'advertiser_name', 'placement', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'placement']
    search_fields = ['title', 'advertiser_name']
