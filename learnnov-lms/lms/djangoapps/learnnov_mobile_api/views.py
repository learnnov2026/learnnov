from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

try:
    from common.djangoapps.student.models import CourseEnrollment
except ImportError:
    try:
        from student.models import CourseEnrollment
    except ImportError:
        # Fallback for environments where student is not installed yet
        CourseEnrollment = None

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            return Response({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
            })
        except Exception as e:
            return Response({"error": "Internal server error", "details": str(e)}, status=500)

class UserCoursesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            
            if not CourseEnrollment:
                return Response({"error": "CourseEnrollment module not available."}, status=500)
                
            enrollments = CourseEnrollment.enrollments_for_user(user)
            
            courses_data = []
            for enrollment in enrollments:
                course_overview = enrollment.course_overview
                if course_overview:
                    courses_data.append({
                        "course_id": str(course_overview.id),
                        "display_name": course_overview.display_name,
                        "short_description": course_overview.short_description,
                        "is_active": enrollment.is_active,
                        "created": enrollment.created,
                        # We can fetch detailed progress via gradebook/course_experience in the future
                        "progress_percentage": 0,
                    })
                
            return Response({
                "enrolled_courses": courses_data
            })
        except Exception as e:
            return Response({"error": "Failed to fetch courses", "details": str(e)}, status=500)
