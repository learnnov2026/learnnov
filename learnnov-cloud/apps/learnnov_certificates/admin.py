from django.contrib import admin
from .models import GeneratedCertificate, SpecializationCertificate, CertificateQRCode

@admin.register(GeneratedCertificate)
class GeneratedCertificateAdmin(admin.ModelAdmin):
    list_display = ['verify_uuid', 'user', 'course_name', 'grade', 'status', 'created_date']
    list_filter = ['status', 'created_date']
    search_fields = ['verify_uuid', 'user__username', 'course_name', 'course_id']

@admin.register(SpecializationCertificate)
class SpecializationCertificateAdmin(admin.ModelAdmin):
    list_display = ['verify_uuid', 'user', 'specialization', 'status', 'created_date']
    list_filter = ['status', 'created_date']
    search_fields = ['verify_uuid', 'user__username', 'specialization__title']

@admin.register(CertificateQRCode)
class CertificateQRCodeAdmin(admin.ModelAdmin):
    list_display = ['verify_uuid', 'verification_url', 'created_at']
    search_fields = ['verify_uuid']
