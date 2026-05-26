from django.db import models

class UnsafeCourse(models.Model):
    """Model to store per‑course unsafe‑code allowance.

    The ``course_id`` should match the string representation used throughout
    the platform (e.g. ``course-v1:edX+DemoX+DemoCourse``).  ``allow_unsafe``
    indicates whether the course may execute code outside the sandbox.
    """

    course_id = models.CharField(max_length=255, unique=True)
    allow_unsafe = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.course_id} → {'unsafe' if self.allow_unsafe else 'safe'}"
