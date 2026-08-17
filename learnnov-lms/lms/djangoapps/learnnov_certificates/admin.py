from django.contrib import admin
from django.utils.html import format_html

from .models import CertificateQRCode


@admin.register(CertificateQRCode)
class CertificateQRCodeAdmin(admin.ModelAdmin):
    list_display = ('verify_uuid', 'verification_url', 'qr_preview', 'created_at')
    search_fields = ('verify_uuid', 'verification_url')
    readonly_fields = ('verify_uuid', 'verification_url', 'qr_image', 'qr_preview', 'created_at')

    def qr_preview(self, obj):
        if obj.qr_image:
            return format_html(
                '<img src="{}" width="64" height="64" style="image-rendering:pixelated"/>',
                obj.qr_image.url,
            )
        return '—'
    qr_preview.short_description = 'QR'

    def has_add_permission(self, request):
        return False
