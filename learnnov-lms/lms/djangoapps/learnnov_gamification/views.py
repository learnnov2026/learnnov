from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserGamificationProfile

class UserProfileGamificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, created = UserGamificationProfile.objects.get_or_create(user=user)
        
        return Response({
            "total_points": profile.total_points,
            "current_streak": profile.current_streak,
            "longest_streak": profile.longest_streak,
            "level": (profile.total_points // 100) + 1  # 1 level every 100 points
        })

class LeaderboardView(APIView):
    # Public or internal access based on requirement
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch top 10 users by points
        top_profiles = UserGamificationProfile.objects.select_related('user').order_by('-total_points')[:10]
        
        leaderboard = []
        for rank, profile in enumerate(top_profiles, start=1):
            leaderboard.append({
                "rank": rank,
                "username": profile.user.username,
                "points": profile.total_points,
            })
            
        return Response({"leaderboard": leaderboard})
