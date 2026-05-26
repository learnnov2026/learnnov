from django.contrib import admin
from .models import CertificateQRCode

@admin.register(CertificateQRCode)
class CertificateQRCodeAdmin(admin.ModelAdmin):
    list_display = ['verify_uuid', 'verification_url', 'created_at']
    search_fields = ['verify_uuid']
