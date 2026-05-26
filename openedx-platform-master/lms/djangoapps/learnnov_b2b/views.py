from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import EnterpriseCompany, EnterpriseLearner

class EnterpriseDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Get companies where the user is an admin
        companies = EnterpriseCompany.objects.filter(admin=user)
        
        data = []
        for company in companies:
            used_licenses = company.learners.count()
            data.append({
                "company_id": company.id,
                "name": company.name,
                "total_licenses": company.total_licenses,
                "used_licenses": used_licenses,
                "available_licenses": company.total_licenses - used_licenses
            })
            
        return Response({"dashboard_data": data})

class CompanyLearnersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response({"error": "company_id is required"}, status=400)
            
        if not str(company_id).isdigit():
            return Response({"error": "company_id must be a valid integer"}, status=400)
            
        try:
            company = EnterpriseCompany.objects.get(id=int(company_id), admin=request.user)
        except (EnterpriseCompany.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Company not found or unauthorized"}, status=403)
            
        learners = company.learners.select_related('user').all()
        learners_data = [{
            "username": learner.user.username,
            "email": learner.user.email,
            "is_active": learner.is_active,
            "joined_at": learner.joined_at
        } for learner in learners]
        
        return Response({"learners": learners_data})
