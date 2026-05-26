"""
QR code generation utilities.
Requires: pip install qrcode[pil] Pillow
"""
import io
import logging

from django.conf import settings
from django.core.files.base import ContentFile

log = logging.getLogger(__name__)


def generate_qr_image(url):
    """
    Generate a QR code PNG image for the given URL.
    Returns a ContentFile ready to save to an ImageField.
    """
    try:
        import qrcode
        from qrcode.image.styledpil import StyledPilImage
        from qrcode.image.styles.colormasks import SolidFillColorMask
        from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
    except ImportError:
        log.error('qrcode library not installed. Run: pip install "qrcode[pil]"')
        return None

    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    try:
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            color_mask=SolidFillColorMask(
                front_color=(15, 118, 110),   # teal — matches LearnNov brand
                back_color=(255, 255, 255),
            ),
        )
    except Exception:
        # Fallback: plain black QR
        img = qr.make_image(fill_color='black', back_color='white')

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return ContentFile(buffer.read())


def get_or_create_qr(verify_uuid, verification_url):
    """
    جلب أو إنشاء سجل QR مع التحقق من صحة الرابط.
    في حال تغير الرابط (مثلاً عند الانتقال من بيئة تجريبية لبيئة إنتاج)، يتم إعادة توليد الصورة تلقائياً.
    """
    from .models import CertificateQRCode

    obj, created = CertificateQRCode.objects.get_or_create(
        verify_uuid=verify_uuid,
        defaults={'verification_url': verification_url},
    )
    
    # التحقق من أن الرابط المخزن يطابق الرابط الحالي
    url_changed = obj.verification_url != verification_url
    
    if created or not obj.qr_image or url_changed:
        if url_changed:
            obj.verification_url = verification_url
            
        content = generate_qr_image(verification_url)
        if content:
            filename = f'{verify_uuid}.png'
            # حذف الصورة القديمة إذا وجدت لتجنب تراكم الملفات
            if obj.qr_image:
                try:
                    obj.qr_image.delete(save=False)
                except Exception as e:
                    log.warning('Failed to delete old QR image for %s: %s', verify_uuid, e)
            obj.qr_image.save(filename, content, save=True)
        else:
            log.warning('QR generation failed for certificate %s', verify_uuid)
    return obj
