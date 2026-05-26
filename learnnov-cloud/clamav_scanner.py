import clamd
import os
import logging

logger = logging.getLogger(__name__)

CLAMAV_HOST = os.getenv('CLAMAV_HOST', 'clamav')
CLAMAV_PORT = int(os.getenv('CLAMAV_PORT', 3310))

def scan_file_for_malware(file_path_or_stream):
    """
    Scans a given file or stream using the ClamAV daemon.
    Returns True if the file is clean, False if malware is detected.
    Raises ConnectionError if ClamAV is unreachable.
    """
    try:
        cd = clamd.ClamdNetworkSocket(CLAMAV_HOST, CLAMAV_PORT)
        
        # Test connection
        if cd.ping() != 'PONG':
            logger.error("ClamAV daemon is not responding to ping.")
            raise ConnectionError("ClamAV daemon unreachable")

        if isinstance(file_path_or_stream, str):
            # It's a file path
            result = cd.instream(open(file_path_or_stream, 'rb'))
        else:
            # It's a stream
            result = cd.instream(file_path_or_stream)
        
        # The result format is a dictionary: {'stream': ('FOUND', 'Eicar-Test-Signature')}
        # or {'stream': ('OK', None)}
        status = result.get('stream', ('ERROR', ''))[0]
        
        if status == 'OK':
            return True
        elif status == 'FOUND':
            virus_name = result['stream'][1]
            logger.warning(f"Malware detected: {virus_name}")
            return False
        else:
            logger.error(f"ClamAV scan error: {result}")
            return False

    except Exception as e:
        logger.exception(f"Error scanning file with ClamAV: {str(e)}")
        raise ConnectionError(f"ClamAV scan failed: {str(e)}")
