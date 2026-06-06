import logging
import datetime
from .mongodb import get_mongodb_database

logger = logging.getLogger(__name__)

def log_user_activity(user, action, metadata=None):
    """Log a user activity entry to MongoDB.

    Args:
        user: Django User instance or None.
        action (str): Description of the activity (e.g., 'login', 'view_course').
        metadata (dict, optional): Additional data to store.
    """
    db = get_mongodb_database()
    if db is None:
        logger.warning("MongoDB not configured; activity not logged.")
        return False
    try:
        doc = {
            "user_id": user.id if user else None,
            "action": action,
            "metadata": metadata or {},
            "created_at": datetime.datetime.utcnow()
        }
        db.activity_logs.insert_one(doc)
        return True
    except Exception as e:
        logger.error(f"Failed to log activity to MongoDB: {e}")
        return False
