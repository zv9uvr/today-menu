# menu/views.py
import random
from django.shortcuts import render
from django.http import JsonResponse
from .models import Restaurant
from django.conf import settings # settings.py의 변수를 쓰기 위해 필요

# 1. 사이트 첫 화면을 띄워주는 함수 (HTML 전용)
def index(request):
    user_profile_img = None
    
    # [추가] 사용자가 로그인 상태라면 카카오 프로필 사진 가져오기
    if request.user.is_authenticated:
        # socialaccount_set에서 카카오 계정 정보를 찾습니다.
        social_account = request.user.socialaccount_set.filter(provider='kakao').first()
        if social_account:
            # 카카오가 주는 데이터 구조에서 프로필 이미지 URL 추출
            user_profile_img = social_account.extra_data.get('properties', {}).get('profile_image')

    context = {
        'kakao_js_key': settings.KAKAO_JS_KEY, # .env에서 가져온 키
        'user_profile_img': user_profile_img,  # 사용자의 카카오 프로필 사진 URL
    }
    
    # context를 같이 보내줘야 index.html에서 {{ kakao_js_key }} 처럼 쓸 수 있습니다.
    return render(request, 'menu/index.html', context)

# 2. 버튼을 눌렀을 때 데이터를 뽑아주는 함수 (JSON 전용)
def get_recommendations(request):
    category = request.GET.get('category')
    
    # DB에서 해당 카테고리 식당 가져오기 (가중치 로직)
    candidates = list(Restaurant.objects.filter(category=category).order_by('pick_count')[:10])
    
    # 장고 DB 데이터가 있을 경우를 위한 안전장치
    selected = random.sample(candidates, 3) if len(candidates) >= 3 else candidates
    
    # JSON 데이터 구성 (기존 logic 유지)
    data = [{'name': r.name, 'url': r.place_url} for r in selected]
    
    return JsonResponse({'results': data})