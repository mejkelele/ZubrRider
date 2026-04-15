from django.urls import path
from .views import AvailableBonusesView, MyBonusesView

urlpatterns = [
    path("available/", AvailableBonusesView.as_view(), name="available_bonuses"),
    path("my-bonuses/", MyBonusesView.as_view(), name="my_bonuses"),
]
