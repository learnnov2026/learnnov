from django.apps import AppConfig


class AcademicProgramsConfig(AppConfig):
    name = 'lms.djangoapps.academic_programs'
    label = 'academic_programs'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'البرامج الأكاديمية'

    def ready(self):
        import lms.djangoapps.academic_programs.signals  # noqa
