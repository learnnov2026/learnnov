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

        # Check if user is enrolled
        is_enrolled = ProgramApplication.objects.filter(
            applicant=request.user,
            program__slug=course_slug,
            status__in=['approved', 'enrolled', 'completed']
        ).exists()

        return is_enrolled


class ThreadListCreateView(generics.ListCreateAPIView):
    """
    List all threads for a course, or create a new one.
    """
    serializer_class = DiscussionThreadSerializer
    permission_classes = [IsEnrolledOrInstructor]

    def get_queryset(self):
        course_slug = self.kwargs.get('course_slug')
        return DiscussionThread.objects.filter(program__slug=course_slug)

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
        return DiscussionThread.objects.filter(program__slug=course_slug)

    def perform_update(self, serializer):
        # Only author or staff can update
        obj = self.get_object()
        if obj.author == self.request.user or self.request.user.is_staff:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to edit this thread.")


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
        
        is_instructor = self.request.user.groups.filter(name='Instructors').exists() or self.request.user.is_staff
        
        serializer.save(
            author=self.request.user,
            thread=thread,
            is_instructor_reply=is_instructor
        )
