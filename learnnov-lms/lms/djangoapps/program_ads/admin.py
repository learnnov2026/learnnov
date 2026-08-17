from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import AdPlacement, Advertisement, AdImpression
from .targeting import invalidate_placement_cache


@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = ('name', 'placement_type', 'max_width', 'max_height', 'base_price_per_day', 'is_active')
    list_filter = ('placement_type', 'is_active')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_active',)


@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'advertiser_name', 'placement', 'ad_type', 'status',
        'is_premium', 'priority', 'start_date', 'end_date',
        'total_impressions', 'total_clicks', 'ctr_display', 'total_spent'
    )
    list_filter = ('status', 'ad_type', 'placement', 'is_premium', 'target_gender')
    search_fields = ('title', 'advertiser_name', 'advertiser_email')
    readonly_fields = (
        'total_impressions', 'total_clicks', 'total_spent',
        'ctr_display', 'image_preview', 'created_at', 'updated_at'
    )
    list_editable = ('status', 'priority', 'is_premium')
    date_hierarchy = 'created_at'
    actions = ['approve_selected', 'activate_selected', 'pause_selected']

    fieldsets = (
        (_('الإعلان'), {
            'fields': ('title', 'advertiser_name', 'advertiser_email', 'ad_type', 'placement', 'status')
        }),
        (_('المحتوى'), {
            'fields': (
                'image', 'image_preview', 'video_url', 'html_content',
                'headline', 'body_text', 'call_to_action', 'destination_url', 'alt_text'
            )
        }),
        (_('الاستهداف'), {
            'fields': (
                'target_gender', 'target_countries', 'target_age_min', 'target_age_max',
                'target_interests', 'target_degree_levels'
            )
        }),
        (_('الجدولة والميزانية'), {
            'fields': ('start_date', 'end_date', 'daily_budget', 'total_budget', 'cost_per_click', 'cost_per_impression')
        }),
        (_('الأولوية'), {
            'fields': ('priority', 'is_premium')
        }),
        (_('الإحصاءات'), {
            'fields': ('total_impressions', 'total_clicks', 'ctr_display', 'total_spent'),
            'classes': ('collapse',)
        }),
        (_('المراجعة'), {
            'fields': ('reviewer_notes',),
        }),
        (_('التواريخ'), {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    @admin.display(description='CTR %')
    def ctr_display(self, obj):
        return f"{obj.ctr}%"

    @admin.display(description=_('معاينة الصورة'))
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-width:300px;max-height:120px;"/>', obj.image.url)
        return '—'

    @admin.action(description=_('الموافقة على الإعلانات المحددة'))
    def approve_selected(self, request, queryset):
        updated = queryset.filter(status__in=['draft', 'pending']).update(status='approved')
        for ad in queryset:
            invalidate_placement_cache(ad.placement.slug)
        self.message_user(request, f'تمت الموافقة على {updated} إعلان.')

    @admin.action(description=_('تشغيل الإعلانات المحددة'))
    def activate_selected(self, request, queryset):
        updated = queryset.filter(status='approved').update(status='active')
        for ad in queryset:
            invalidate_placement_cache(ad.placement.slug)
        self.message_user(request, f'تم تشغيل {updated} إعلان.')

    @admin.action(description=_('إيقاف الإعلانات مؤقتاً'))
    def pause_selected(self, request, queryset):
        updated = queryset.filter(status='active').update(status='paused')
        for ad in queryset:
            invalidate_placement_cache(ad.placement.slug)
        self.message_user(request, f'تم إيقاف {updated} إعلان مؤقتاً.')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
        invalidate_placement_cache(obj.placement.slug)


@admin.register(AdImpression)
class AdImpressionAdmin(admin.ModelAdmin):
    list_display = ('advertisement', 'event_type', 'user', 'ip_address', 'country_code', 'created_at')
    list_filter = ('event_type', 'country_code')
    search_fields = ('advertisement__title', 'ip_address', 'user__username')
    readonly_fields = ('advertisement', 'user', 'event_type', 'ip_address', 'user_agent', 'referrer', 'session_key', 'country_code', 'created_at')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
