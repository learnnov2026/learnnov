import logging
from django.conf import settings

logger = logging.getLogger(__name__)

_mongo_client = None

def get_mongodb_client():
    """
    يتصل بقاعدة بيانات MongoDB ويتحقق من سلامة الاتصال.
    يعود بـ None في حال عدم توفر pymongo أو عدم تهيئة MONGODB_URI.
    """
    global _mongo_client
    if _mongo_client is not None:
        return _mongo_client

    uri = getattr(settings, 'MONGODB_URI', '')
    if not uri:
        return None

    try:
        from pymongo import MongoClient
        _mongo_client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        # التحقق الفعلي من الاتصال
        _mongo_client.admin.command('ping')
        return _mongo_client
    except ImportError:
        logger.warning("pymongo is not installed. MongoDB integration disabled.")
        return None
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        return None

def get_mongodb_database():
    """
    يعود بكائن قاعدة البيانات لـ MongoDB.
    """
    client = get_mongodb_client()
    if client is None:
        return None
    db_name = getattr(settings, 'MONGODB_DB_NAME', 'learnnov')
    db = client[db_name]
    # Ensure indexes for used collections
    try:
        db.chat_messages.create_index('room_id')
        db.chat_messages.create_index('user_id')
        db.chat_messages.create_index('discussion_id')
        db.chat_messages.create_index('created_at')
        db.activity_logs.create_index('user_id')
        # TTL index to auto-delete logs older than 90 days
        db.activity_logs.create_index('created_at', expireAfterSeconds=90 * 86400)
    except Exception as e:
        logger.error(f"Failed to create MongoDB indexes: {e}")
    return db
