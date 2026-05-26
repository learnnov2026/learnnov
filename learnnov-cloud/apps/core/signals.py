from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.core.tasks import delete_user_from_external_services

User = get_user_model()

@receiver(post_delete, sender=User)
def handle_user_deleted(sender, instance, **kwargs):
    """
    Triggered when a user is successfully deleted from the database.
    Dispatches a Celery task to asynchronously clean up external services.
    """
    # Fire and forget
    delete_user_from_external_services.delay(
        user_id=instance.id,
        user_email=instance.email
    )
