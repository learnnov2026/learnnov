"""Service layer for Course Discussions.

Provides business‑logic functions that encapsulate ORM operations for
threads and posts. Viewsets delegate to these helpers, keeping the
views thin and easier to test.
"""

from django.shortcuts import get_object_or_404
from apps.academic_programs.models import AcademicProgram
from .models import DiscussionThread, DiscussionPost
from .serializers import DiscussionThreadSerializer, DiscussionPostSerializer


def create_thread(serializer: DiscussionThreadSerializer, user, course_slug: str):
    """Create a new discussion thread linked to the given academic program.

    Args:
        serializer: Validated serializer instance.
        user: Request user (author of the thread).
        course_slug: Slug of the AcademicProgram.
    """
    program = get_object_or_404(AcademicProgram, slug=course_slug)
    serializer.save(author=user, program=program)


def update_thread(serializer: DiscussionThreadSerializer, user, instance: DiscussionThread):
    """Update an existing thread if the user is allowed.

    Allows the author, staff or superuser to modify the thread.
    """
    if instance.author == user or user.is_staff or user.is_superuser:
        serializer.save()
    else:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You are not the author of this thread.")


def delete_thread(user, instance: DiscussionThread):
    """Delete a thread if the user has permission.
    """
    if instance.author == user or user.is_staff or user.is_superuser:
        instance.delete()
    else:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You are not the author of this thread.")


def create_post(serializer: DiscussionPostSerializer, user, course_slug: str, thread_id: int):
    """Create a new discussion post (reply) linked to a thread.
    """
    thread = get_object_or_404(DiscussionThread, id=thread_id, program__slug=course_slug)
    is_instructor = user.groups.filter(name='Instructors').exists() or user.is_staff or user.is_superuser
    serializer.save(author=user, thread=thread, is_instructor_reply=is_instructor)
