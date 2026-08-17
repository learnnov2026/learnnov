from django.apps import AppConfig


class UniversityAdsConfig(AppConfig):
    name = 'lms.djangoapps.university_ads'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'University Ads'

    def ready(self):
        import lms.djangoapps.university_ads.signals  # noqa: F401
