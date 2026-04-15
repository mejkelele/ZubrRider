from rest_framework import serializers
from .models import Bonus, UserBonus


class BonusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bonus
        fields = ["id", "name", "description"]


class UserBonusSerializer(serializers.ModelSerializer):
    bonus = BonusSerializer(read_only=True)

    class Meta:
        model = UserBonus
        fields = ["id", "bonus", "granted_at", "expires_at"]
