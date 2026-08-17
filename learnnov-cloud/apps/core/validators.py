import os
import filetype
import clamd
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def validate_file_type(file):
    """
    Validates file content type using filetype signatures to prevent 
    users from hiding malicious executables as PDFs/Images.
    """
    valid_mime_types = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'video/mp4',
        'video/webm',
        'audio/mpeg',
        'audio/wav',
    ]

    try:
        # Read the first 2048 bytes to determine file type
        file_head = file.read(2048)
        file.seek(0)
        kind = filetype.guess(file_head)
        
        if kind is None:
            # We couldn't guess the type. Could be plain text or unsupported.
            # In a strict environment, reject. 
            pass # We'll let it pass for text files or we can be strict.
        elif kind.mime not in valid_mime_types:
            raise ValidationError(
                _('Unsupported file type detected: %(type)s. Only PDF, Images, and Word docs are allowed.'),
                params={'type': kind.mime},
            )
    except Exception as e:
        if isinstance(e, ValidationError):
            raise
        # Log the error but fail securely
        raise ValidationError(_('Unable to verify the file type securely.'))


def validate_file_infection(file):
    """
    Scans the uploaded file for malware/viruses using ClamAV.
    Requires a running clamd service.
    
    سلوك الأمان:
    - بيئة الإنتاج (DEBUG=False): رفض الملف إذا كان ClamAV غير متاح (Fail-Closed).
    - بيئة التطوير (DEBUG=True): السماح مع تسجيل تحذير (Fail-Open للتطوير فقط).
    """
    import logging
    from django.conf import settings
    logger = logging.getLogger(__name__)
    
    clamav_host = os.getenv('CLAMAV_HOST', 'clamav')
    clamav_port = int(os.getenv('CLAMAV_PORT', 3310))
    try:
        # Connect to ClamAV daemon
        cd = clamd.ClamdNetworkSocket(host=clamav_host, port=clamav_port)
        
        # Test connection
        if not cd.ping() == 'PONG':
            if settings.DEBUG:
                logger.warning('[SECURITY] ClamAV is unavailable — file scan skipped (DEV mode only). '
                               'This MUST be fixed before going to production.')
                return
            raise ValidationError(_('خدمة فحص الأمان غير متاحة حالياً. يرجى المحاولة لاحقاً.'))
        
        # Perform scan on the stream
        # clamd.instream expects a file-like object with read()
        scan_result = cd.instream(file)
        file.seek(0)

        # scan_result structure: {'stream': ('FOUND', 'Eicar-Test-Signature')}
        if scan_result and scan_result.get('stream', [None])[0] == 'FOUND':
            virus_name = scan_result['stream'][1]
            raise ValidationError(
                _('تم اكتشاف تهديد أمني في الملف: %(virus)s'),
                params={'virus': virus_name},
            )

    except clamd.ConnectionError:
        file.seek(0)
        if settings.DEBUG:
            # في بيئة التطوير: السماح مع تحذير واضح
            logger.warning(
                '[SECURITY] ClamAV daemon is not running (ConnectionError). '
                'File upload allowed in DEBUG mode only. '
                'CRITICAL: Ensure ClamAV is running before deploying to production!'
            )
        else:
            # في بيئة الإنتاج: رفض الملف (Fail-Closed) — لا مساومة على الأمان
            logger.error('[SECURITY] ClamAV daemon is unreachable in PRODUCTION. File upload rejected.')
            raise ValidationError(
                _('خدمة فحص الأمان غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.')
            )
    except Exception as e:
        file.seek(0)
        if isinstance(e, ValidationError):
            raise
        logger.error(f'[SECURITY] Unexpected error during ClamAV scan: {e}')
        if not settings.DEBUG:
            # في الإنتاج: رفض أي خطأ غير متوقع بدلاً من السماح به
            raise ValidationError(_('تعذّر إتمام فحص الأمان. يرجى المحاولة لاحقاً.'))
