from django.conf import settings
from django.db import models

from rides.models import Ride


class Rating(models.Model):
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='ratings')
    rater = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_ratings')
    rated_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_ratings')
    score = models.IntegerField()
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ('ride', 'rater', 'rated_user')

    def __str__(self):
        return f"{self.rater.email} → {self.rated_user.email}: {self.score}/5"


class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.email} → {self.receiver.email} ({self.ride.id}): {self.content[:50]}"


class Alert(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alerts')
    content = models.CharField(max_length=255)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email}: {self.content} (read={self.is_read})"