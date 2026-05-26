from django.apps import AppConfig


class LearnNovPaymentsConfig(AppConfig):
    name = 'lms.djangoapps.learnnov_payments'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'LearnNov Payments'

    def ready(self):
        import lms.djangoapps.learnnov_payments.signals  # noqa
