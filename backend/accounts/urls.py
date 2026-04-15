from django.urls import path
from .views import (
    RegisterView,
    UserProfileView,
    DriverProfileView,
    MyCarsView,
    ManageCarView,
    CarDeleteView,
    WalletDetailView,
    WalletTopUpView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # rejestracja
    path("register/", RegisterView.as_view(), name="auth_register"),
    # logowanie
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    # token reset
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # profil prywatny (GET + PUT/PATCH)
    path("profile/", UserProfileView.as_view(), name="user_profile"),
    # profil kierowcy (publiczny)
    path("driver/<int:pk>/", DriverProfileView.as_view(), name="driver_profile"),
    # samochody
    path("my-cars/", MyCarsView.as_view(), name="my_cars"),
    path("car/", ManageCarView.as_view(), name="manage_car"),
    path("car/<int:pk>/", CarDeleteView.as_view(), name="car_delete"),
    # portfel
    path("wallet/", WalletDetailView.as_view(), name="wallet_detail"),
    path("wallet/top-up/", WalletTopUpView.as_view(), name="wallet_top_up"),
]
