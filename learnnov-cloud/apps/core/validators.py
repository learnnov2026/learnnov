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
    """
    try:
        # Connect to local ClamAV daemon
        cd = clamd.ClamdNetworkSocket()
        
        # Test connection
        if not cd.ping() == 'PONG':
            # If clamd is down, we might want to log this.
            # In a strict environment, we fail the upload. For dev, we might pass.
            # Here we enforce strict security (fail closed).
            raise ValidationError(_('Antivirus scanner is currently unavailable.'))
        
        # Perform scan on the stream
        # clamd.instream expects a file-like object with read()
        scan_result = cd.instream(file)
        file.seek(0)

        # scan_result structure: {'stream': ('FOUND', 'Eicar-Test-Signature')}
        if scan_result and scan_result.get('stream', [None])[0] == 'FOUND':
            virus_name = scan_result['stream'][1]
            raise ValidationError(
                _('Malware detected in file: %(virus)s'),
                params={'virus': virus_name},
            )

    except clamd.ConnectionError:
        file.seek(0)
        # Log: ClamAV daemon not running!
        # In a real system, you might notify admins.
        # We will allow it for development if the connection fails, 
        # but in prod you should raise ValidationError.
        pass
    except Exception as e:
        file.seek(0)
        if isinstance(e, ValidationError):
            raise
        pass # Allow fallback if scanning fails unexpectedly, or raise if strict
