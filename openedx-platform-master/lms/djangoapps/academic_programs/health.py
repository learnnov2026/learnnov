from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db import connection
from django.core.cache import cache

class HealthCheckView(APIView):
    """واجهة فحص صحة النظام للتأكد من اتصال قاعدة البيانات وRedis."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        health = {'status': 'healthy', 'checks': {}}
        
        # 1. فحص قاعدة البيانات
        try:
            connection.ensure_connection()
            health['checks']['database'] = 'ok'
        except Exception as e:
            from logging import getLogger
            getLogger(__name__).error(f"Health Check DB Error: {e}")
            health['status'] = 'unhealthy'
            health['checks']['database'] = 'connection_error'
            
        # 2. فحص Redis (Cache)
        try:
            cache.set('health_check', 'ok', 10)
            if cache.get('health_check') == 'ok':
                health['checks']['cache'] = 'ok'
            else:
                raise Exception("Cache retrieval failed")
        except Exception as e:
            from logging import getLogger
            getLogger(__name__).error(f"Health Check Cache Error: {e}")
            health['status'] = 'unhealthy'
            health['checks']['cache'] = 'cache_error'
            
        status_code = 200 if health['status'] == 'healthy' else 503
        return Response(health, status=status_code)
