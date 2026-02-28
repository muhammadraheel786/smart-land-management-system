from django.urls import path
from . import views
from .auth import login_view

urlpatterns = [
    # All API endpoints are defined without trailing slash to avoid Next.js
    # 308 redirects and 404s (canonical form: /api/...).
    path('auth/login', login_view),
    path('dashboard', views.dashboard),
    path('fields', views.fields_list),
    path('fields/<str:pk>', views.fields_detail),
    path('expenses', views.expenses_list),
    path('expenses/<str:pk>', views.expenses_detail),
    path('incomes', views.incomes_list),
    path('incomes/<str:pk>', views.incomes_detail),
    path('thaka', views.thaka_list),
    path('thaka/<str:pk>', views.thaka_detail),
    path('water/analysis', views.water_analysis),
    path('water', views.water_list),
    path('water/<str:pk>', views.water_detail),
    path('temperature', views.temperature_list),
    path('ai/recommendations', views.ai_recommendations),
    path('ai/insights', views.ai_insights),
    path('ai/chat', views.ai_chat),
    path('predict', views.predict),
    # Data Bank & Materials
    path('materials', views.materials_list),
    path('materials/<str:pk>', views.materials_detail),
    path('material-transactions', views.material_transactions_list),
    path('material-transactions/<str:pk>', views.material_transactions_detail),
    path('daily-register', views.daily_register_list),
    path('daily-register/<str:pk>', views.daily_register_detail),
    path('field-recommendations', views.field_recommendations),
]
