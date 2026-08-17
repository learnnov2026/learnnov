from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class LearnNovExamsConfig(AppConfig):
    name = 'lms.djangoapps.learnnov_exams'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = _('LearnNov Mock Exams')
