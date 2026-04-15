from django.urls import path
from .views import (
    CreateRatingView,
    MyAlertsView,
    UnreadAlertsCountView,
    MarkAlertReadView,
    MarkAllAlertsReadView,
    RideMessagesView,
)

urlpatterns = [
    # Oceny
    path("rate/", CreateRatingView.as_view(), name="create_rating"),
    # Alerty
    path("my-alerts/", MyAlertsView.as_view(), name="my_alerts"),
    path("alerts/unread-count/", UnreadAlertsCountView.as_view(), name="unread_alerts_count"),
    path("alert/<int:pk>/read/", MarkAlertReadView.as_view(), name="mark_alert_read"),
    path("alerts/read-all/", MarkAllAlertsReadView.as_view(), name="mark_all_alerts_read"),
    # Wiadomości w kontekście przejazdu
    path("messages/<int:ride_id>/", RideMessagesView.as_view(), name="ride_messages"),
]
