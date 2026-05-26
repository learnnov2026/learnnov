from django.apps import AppConfig

class AcademicProgramsConfig(AppConfig):
    name = 'apps.academic_programs'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'البرامج الأكاديمية'

    def ready(self):
        import apps.academic_programs.signals  # noqa
