from django.urls import path
from .views import (
    RideDetailView,
    RideCreateView,
    MyRidesView,
    RideListView,
    BookRideView,
    CancelBookingView,
    CancelRideView,
    WalletBalanceView,
    TransactionHistoryView,
    RideBookingsView,
)

urlpatterns = [
    # Przejazdy
    path("", RideListView.as_view(), name="ride_list"),
    path("create/", RideCreateView.as_view(), name="ride_create"),
    path("my-rides/", MyRidesView.as_view(), name="my_rides"),
    path("<int:pk>/", RideDetailView.as_view(), name="ride_detail"),
    path("<int:pk>/bookings/", RideBookingsView.as_view(), name="ride_bookings"),
    # Rezerwacje
    path("<int:pk>/book/", BookRideView.as_view(), name="ride_book"),
    path("<int:pk>/cancel/", CancelRideView.as_view(), name="ride_cancel"),
    path("booking/<int:pk>/cancel/", CancelBookingView.as_view(), name="booking_cancel"),
    # Portfel
    path("wallet/balance/", WalletBalanceView.as_view(), name="wallet_balance"),
    path("wallet/transactions/", TransactionHistoryView.as_view(), name="wallet_transactions"),
]
