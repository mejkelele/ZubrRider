from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Bonus, UserBonus
from .serializers import BonusSerializer, UserBonusSerializer


class AvailableBonusesView(generics.ListAPIView):
    """Lista wszystkich dostępnych bonusów."""

    queryset = Bonus.objects.all()
    serializer_class = BonusSerializer
    permission_classes = [IsAuthenticated]


class MyBonusesView(generics.ListAPIView):
    """Lista bonusów przypisanych do użytkownika."""

    serializer_class = UserBonusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserBonus.objects.filter(user=self.request.user).order_by("-granted_at")
