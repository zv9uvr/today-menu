from django.contrib import admin
from django.urls import path, include  # include는 꼭 있어야 합니다!
from menu.views import index, get_recommendations

urlpatterns = [
    # admin.urls를 다시 admin.site.urls로 바꿨습니다!
    path('admin/', admin.site.urls), 
    
    path('', index, name='index'), 
    path('api/recommend/', get_recommendations, name='get_recommend'),
    
    # 카카오 로그인을 위해 꼭 필요한 줄
    path('accounts/', include('allauth.urls')), 
]