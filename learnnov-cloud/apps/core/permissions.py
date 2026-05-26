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
