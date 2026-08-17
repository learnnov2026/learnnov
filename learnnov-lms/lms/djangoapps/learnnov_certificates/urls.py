from django.urls import path

from . import views

app_name = 'learnnov_certificates'

urlpatterns = [
    # Arabic certificate rendering
    path('ar/<str:verify_uuid>/', views.render_certificate, name='render_certificate'),
    # Public verification page
    path('verify/<str:verify_uuid>/', views.verify_certificate, name='verify_certificate'),
]
