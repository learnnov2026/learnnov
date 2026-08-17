from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class GamificationActivityMiddleware:
    """
    ميدلوير عالي الأداء لتتبع نشاط الطالب اليومي وتحديث سلسلة المثابرة (Streak) تلقائياً.
    يعتمد على حفظ حالة التحقق في جلسة المستخدم لمنع الاستعلام المتكرر من قاعدة البيانات في كل طلب.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # التحقق فقط إذا كان المستخدم مسجلاً دخوله
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                today = timezone.now().date()
                today_str = today.isoformat()
                
                # استخدام كاش الجلسة لمنع إجراء أي استعلامات لقاعدة البيانات إذا تم التحقق اليوم بالفعل
                if request.session.get('last_gamification_check') != today_str:
                    from .models import UserGamificationProfile
                    
                    # جلب أو إنشاء ملف النقاط والتحفيز
                    profile, created = UserGamificationProfile.objects.get_or_create(user=request.user)
                    
                    # في حال كان النشاط اليومي الجديد مختلفاً عن تاريخ آخر نشاط مسجل
                    if profile.last_activity_date != today:
                        profile.update_streak()
                        
                    # تحديث تاريخ الجلسة لمنع التحقق مجدداً اليوم
                    request.session['last_gamification_check'] = today_str
            except Exception as e:
                # الفشل بصمت لضمان عدم توقف الموقع أو تعطل تجربة المستخدم لأي سبب في قاعدة البيانات
                logger.error("Gamification activity tracking error: %s", str(e))
                
        response = self.get_response(request)
        return response
