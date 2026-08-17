from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'

    def ready(self):
        # Patch RequestContext and Context for Python 3.14 compatibility with Django 4.2
        try:
            from django.template.context import RequestContext, Context
            if not hasattr(RequestContext, '_patched_314'):
                RequestContext.__copy__ = lambda self: self
                Context.__copy__ = lambda self: self
                RequestContext._patched_314 = True
        except Exception:
            pass

        # Implicitly connect signal handlers decorated with @receiver.
        import apps.core.signals
        
        # Register models for auditing
        try:
            from auditlog.registry import auditlog
            from apps.academic_programs.models import ProgramApplication, AcademicProgram
            from apps.learnnov_payments.models import StripePayment, DiscountCode
            from apps.university_ads.models import UniversityAd
            
            auditlog.register(ProgramApplication)
            auditlog.register(AcademicProgram)
            auditlog.register(StripePayment)
            auditlog.register(DiscountCode)
            auditlog.register(UniversityAd)
        except Exception:
            pass

        # Override built-in apps verbose_name to Arabic
        try:
            from django.contrib.auth.apps import AuthConfig
            AuthConfig.verbose_name = 'المستخدمون والصلاحيات'
        except Exception:
            pass

        try:
            from auditlog.apps import AuditlogConfig
            AuditlogConfig.verbose_name = 'سجل العمليات والتدقيق'
        except Exception:
            pass
