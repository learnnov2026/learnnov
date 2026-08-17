from django.apps import AppConfig


class LearnNovCertificatesConfig(AppConfig):
    name = 'lms.djangoapps.learnnov_certificates'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'LearnNov Certificates'

    def ready(self):
        import lms.djangoapps.learnnov_certificates.signals  # noqa: F401
