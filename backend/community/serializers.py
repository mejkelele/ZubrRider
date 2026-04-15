from rest_framework import serializers
from .models import Rating, Message, Alert


class RatingSerializer(serializers.ModelSerializer):
    rater_name = serializers.ReadOnlyField(source="rater.first_name")
    rated_user_name = serializers.ReadOnlyField(source="rated_user.first_name")

    class Meta:
        model = Rating
        fields = [
            "id",
            "ride",
            "rater",
            "rated_user",
            "score",
            "comment",
            "rater_name",
            "rated_user_name",
        ]
        read_only_fields = ["id", "rater", "rater_name", "rated_user_name"]

    def validate_score(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Ocena musi być w zakresie 1-5.")
        return value


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source="sender.first_name")

    class Meta:
        model = Message
        fields = ["id", "sender", "receiver", "ride", "content", "sent_at", "sender_name"]
        read_only_fields = ["id", "sender", "sent_at", "sender_name"]


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ["id", "content", "link", "is_read", "created_at"]
        read_only_fields = ["id", "content", "link", "created_at"]
