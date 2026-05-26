import logging
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def delete_user_from_external_services(self, user_id, user_email):
    """
    Saga pattern implementation to handle cleanup in external services
    when a user is deleted from the primary database.
    """
    logger.info(f"Dispatching user.deleted event for {user_email} (ID: {user_id})")

    try:
        # Step 1: Unsubscribe from mailing lists
        logger.info(f"Unsubscribing {user_email} from mailing lists...")
        # e.g., requests.post('https://api.mailchimp.com/3.0/lists/delete', ...)
        
        # Step 2: Delete from Zoom
        logger.info(f"Deleting Zoom account or meetings for {user_email}...")
        # e.g., requests.delete(f'https://api.zoom.us/v2/users/{user_email}')

        # Step 3: Anonymize Analytics
        logger.info(f"Anonymizing analytics data for user {user_id}...")
        # e.g., requests.post('https://api.segment.io/v1/delete', json={"userId": user_id})

        logger.info(f"External service cleanup completed for {user_email}.")
    except Exception as exc:
        logger.error(f"Failed to cleanup external services for {user_email}. Retrying...")
        # Exponential backoff retry
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
