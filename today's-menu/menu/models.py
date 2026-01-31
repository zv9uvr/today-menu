# menu/models.py
from django.db import models

class Restaurant(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20)  # 한식, 중식 등
    place_url = models.URLField()              # 카카오 상세 페이지
    pick_count = models.IntegerField(default=0) # 이 식당이 몇 번 뽑혔나? (가중치용)
    last_picked_at = models.DateTimeField(auto_now=True) # 최근 언제 뽑혔나?

    def __str__(self):
        return self.name