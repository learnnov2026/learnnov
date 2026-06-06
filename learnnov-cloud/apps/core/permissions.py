from rest_framework import permissions

class IsStudent(permissions.BasePermission):
    """
    Allows access only to users in the 'Students' group.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name='Students').exists()
        )

class IsInstructor(permissions.BasePermission):
    """
    Allows access only to users in the 'Instructors' group.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name='Instructors').exists()
        )

class IsProviderAdmin(permissions.BasePermission):
    """
    Allows access only to users in the 'Providers' group.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name='Providers').exists()
        )

class IsInstructorOrReadOnly(permissions.BasePermission):
    """
    Allows read-only access to anyone, but modifications only to Instructors.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name='Instructors').exists()
        )

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `owner` or `provider` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner.
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'provider') and hasattr(obj.provider, 'admins'):
            # Example: If object belongs to a Provider, check if user is an admin of that provider
            return request.user in obj.provider.admins.all()
        return False


def has_active_enrollment(user, program):
    """
    Checks if a user is actively enrolled in a course, either via a ProgramApplication
    or because they have an active subscription.
    """
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser or user.groups.filter(name='Instructors').exists():
        return True

    # 1. Check if user has an accepted program application
    from apps.academic_programs.models import ProgramApplication
    if ProgramApplication.objects.filter(
        applicant=user,
        program=program,
        status__in=['accepted', 'enrolled', 'completed', 'approved']
    ).exists():
        return True

    # 2. Check if user has an active subscription
    from apps.learnnov_payments.models import UserSubscription
    from django.utils import timezone
    if UserSubscription.objects.filter(
        user=user,
        status__in=['active', 'trialing'],
        current_period_end__gt=timezone.now()
    ).exists():
        return True

    return False

