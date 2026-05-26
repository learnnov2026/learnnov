from django.apps import AppConfig

class LearnnovGamificationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'lms.djangoapps.learnnov_gamification'
    verbose_name = 'LearnNov Gamification'

    def ready(self):
        # استيراد وتسجيل إشارات التحفيز والنقاط عند جاهزية التطبيق
        import lms.djangoapps.learnnov_gamification.signals
