from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'

    def ready(self):
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
        except ImportError:
            pass
