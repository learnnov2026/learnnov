from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.academic_programs.models import AcademicProgram, ProgramApplication
from .models import DiscussionThread, DiscussionPost
from .serializers import DiscussionThreadSerializer, DiscussionPostSerializer

class IsEnrolledOrInstructor(permissions.BasePermission):
    """
    Custom permission to only allow enrolled students or instructors of a course
    to access its discussions.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        course_slug = view.kwargs.get('course_slug')
        if not course_slug:
            return False

        # Staff/Superusers can bypass
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Check if user is in 'Instructors' group
        if request.user.groups.filter(name='Instructors').exists():
            return True

        try:
            program = AcademicProgram.objects.get(slug=course_slug)
        except AcademicProgram.DoesNotExist:
            return False

        from apps.core.permissions import has_active_enrollment
        return has_active_enrollment(request.user, program)


class ThreadListCreateView(generics.ListCreateAPIView):
    """
    List all threads for a course, or create a new one.
    """
    serializer_class = DiscussionThreadSerializer
    permission_classes = [IsEnrolledOrInstructor]

    def get_queryset(self):
        course_slug = self.kwargs.get('course_slug')
        from django.db.models import Count
        return DiscussionThread.objects.filter(
            program__slug=course_slug
        ).select_related('author').prefetch_related('posts__author').annotate(
            annotated_reply_count=Count('posts')
        ).order_by('-is_pinned', '-created_at')

    def perform_create(self, serializer):
        course_slug = self.kwargs.get('course_slug')
        program = get_object_or_404(AcademicProgram, slug=course_slug)
        serializer.save(author=self.request.user, program=program)


class ThreadDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific thread.
    """
    serializer_class = DiscussionThreadSerializer
    permission_classes = [IsEnrolledOrInstructor]

    def get_queryset(self):
        course_slug = self.kwargs.get('course_slug')
        from django.db.models import Count
        return DiscussionThread.objects.filter(
            program__slug=course_slug
        ).select_related('author').prefetch_related('posts__author').annotate(
            annotated_reply_count=Count('posts')
        )

    def perform_update(self, serializer):
        user = self.request.user
        obj = self.get_object()
        if obj.author == user or user.is_staff or user.is_superuser:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not the author of this thread.")


class PostCreateView(generics.CreateAPIView):
    """
    Add a reply to a thread.
    """
    serializer_class = DiscussionPostSerializer
    permission_classes = [IsEnrolledOrInstructor]

    def perform_create(self, serializer):
        course_slug = self.kwargs.get('course_slug')
        thread_id = self.kwargs.get('thread_id')
        thread = get_object_or_404(DiscussionThread, id=thread_id, program__slug=course_slug)
        
        user = self.request.user
        is_instructor = user.groups.filter(name='Instructors').exists() or user.is_staff or user.is_superuser
        
        serializer.save(
            author=user,
            thread=thread,
            is_instructor_reply=is_instructor
        )
