from django.contrib import admin
from .models import EnterpriseCompany, EnterpriseLearner

@admin.register(EnterpriseCompany)
class EnterpriseCompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'admin', 'total_licenses', 'created_at')
    search_fields = ('name', 'admin__username', 'admin__email')
    list_filter = ('created_at',)

@admin.register(EnterpriseLearner)
class EnterpriseLearnerAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'is_active', 'joined_at')
    search_fields = ('user__username', 'user__email', 'company__name')
    list_filter = ('is_active', 'company')
