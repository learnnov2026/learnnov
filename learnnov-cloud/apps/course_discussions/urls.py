from django.urls import path
from .views import ThreadListCreateView, ThreadDetailView, PostCreateView

app_name = 'course_discussions'

urlpatterns = [
    # api/discussions/<course_slug>/
    path('<slug:course_slug>/', ThreadListCreateView.as_view(), name='thread-list-create'),
    path('<slug:course_slug>/threads/<int:pk>/', ThreadDetailView.as_view(), name='thread-detail'),
    path('<slug:course_slug>/threads/<int:thread_id>/reply/', PostCreateView.as_view(), name='post-create'),
]
