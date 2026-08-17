from django.contrib import admin
from django.utils.html import format_html

from .models import AdClick, AdImpression, University, UniversityAd


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name_ar', 'name', 'staff_user', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'name_ar')
    raw_id_fields = ('staff_user',)

    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" width="80"/>', obj.logo.url)
        return '—'
    logo_preview.short_description = 'الشعار'


class AdImpressionInline(admin.TabularInline):
    model = AdImpression
    extra = 0
    readonly_fields = ('user', 'ip_address', 'page', 'timestamp')
    can_delete = False
    max_num = 0


class AdClickInline(admin.TabularInline):
    model = AdClick
    extra = 0
    readonly_fields = ('user', 'ip_address', 'timestamp')
    can_delete = False
    max_num = 0


@admin.register(UniversityAd)
class UniversityAdAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'university', 'placement', 'is_active',
        'start_date', 'end_date', 'priority',
        'total_impressions', 'total_clicks', 'ctr_display'
    )
    list_filter = ('is_active', 'placement', 'university')
    search_fields = ('title', 'university__name', 'university__name_ar')
    readonly_fields = ('total_impressions', 'total_clicks', 'ctr_display', 'image_preview')
    fieldsets = (
        ('معلومات الإعلان', {
            'fields': ('university', 'title', 'description', 'image', 'image_preview', 'link_url')
        }),
        ('الجدول الزمني والعرض', {
            'fields': ('placement', 'priority', 'is_active', 'start_date', 'end_date', 'max_impressions')
        }),
        ('الإحصائيات', {
            'fields': ('total_impressions', 'total_clicks', 'ctr_display'),
            'classes': ('collapse',)
        }),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-width:300px;max-height:150px;"/>', obj.image.url)
        return '—'
    image_preview.short_description = 'معاينة الصورة'

    def total_impressions(self, obj):
        return obj.total_impressions
    total_impressions.short_description = 'المشاهدات'

    def total_clicks(self, obj):
        return obj.total_clicks
    total_clicks.short_description = 'النقرات'

    def ctr_display(self, obj):
        return f'{obj.ctr}%'
    ctr_display.short_description = 'نسبة النقر CTR'
