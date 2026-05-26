import hmac
import hashlib
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class ZoomWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        zoom_signature = request.headers.get('x-zm-signature')
        zoom_timestamp = request.headers.get('x-zm-request-timestamp')
        zoom_secret = getattr(settings, 'ZOOM_WEBHOOK_SECRET', '')

        if not zoom_signature or not zoom_timestamp or not zoom_secret:
            return Response("Missing signature", status=status.HTTP_400_BAD_REQUEST)

        try:
            # Construct message
            message = f"v0:{zoom_timestamp}:{request.body.decode('utf-8')}"
            
            # Hash
            hash_for_verify = hmac.new(
                zoom_secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            expected_signature = f"v0={hash_for_verify}"

            if not hmac.compare_digest(zoom_signature, expected_signature):
                logger.warning("Invalid Zoom Webhook Signature")
                return Response("Invalid signature", status=status.HTTP_403_FORBIDDEN)
                
            payload = json.loads(request.body)
            event = payload.get('event')

            # Zoom Endpoint URL Validation
            if event == 'endpoint.url_validation':
                plain_token = payload['payload']['plainToken']
                encrypted_token = hmac.new(
                    zoom_secret.encode('utf-8'),
                    plain_token.encode('utf-8'),
                    hashlib.sha256
                ).hexdigest()
                return Response({
                    "plainToken": plain_token,
                    "encryptedToken": encrypted_token
                }, status=status.HTTP_200_OK)

            # Handle other events here...
            
            return Response(status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Zoom webhook error: {str(e)}")
            return Response(status=status.HTTP_400_BAD_REQUEST)
