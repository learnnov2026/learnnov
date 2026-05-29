from django.urls import path
from . import views

app_name = 'learnnov_certificates'

urlpatterns = [
    # REST API for Vercel Frontend
    path('verify/<str:verify_uuid>/', views.CertificateVerifyAPIView.as_view(), name='verify_api'),
    path('generate/', views.GenerateCertificateView.as_view(), name='generate-certificate'),
    path('my/', views.StudentCertificatesListView.as_view(), name='my-certificates'),
    
    # HTML Renderings (Bilingual template previews and printable PDFs)
    path('ar/<str:verify_uuid>/', views.render_certificate_html, name='render_certificate_html'),
    path('verify-html/<str:verify_uuid>/', views.verify_certificate_html, name='verify_certificate_html'),
]
