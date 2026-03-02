from django.urls import path
from . import views
from .auth import login_view
from . import activities_view

urlpatterns = [
    # All API endpoints are defined without trailing slash to avoid Next.js
    # 308 redirects and 404s (canonical form: /api/...).
    path('auth/login', login_view),
    path('dashboard', views.dashboard),
    path('fields', views.fields_list),
    path('fields/<str:pk>', views.fields_detail),
    # Unified Activities
    path('activities', activities_view.activities_list),
    path('activities/<str:pk>', activities_view.activities_detail),
    
    path('thaka', views.thaka_list),
    path('thaka/<str:pk>', views.thaka_detail),
    path('temperature', views.temperature_list),
    
    path('water/analysis', views.water_analysis),  # Keep analysis or refactor it
    
    path('ai/recommendations', views.ai_recommendations),
    path('ai/insights', views.ai_insights),
    path('ai/chat', views.ai_chat),
    path('predict', views.predict),
    
    # Materials
    path('materials', views.materials_list),
    path('materials/<str:pk>', views.materials_detail),
    
    # Keeping this for ML/Suggestions if used
    path('field-recommendations', views.field_recommendations),
]
