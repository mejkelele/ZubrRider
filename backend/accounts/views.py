from decimal import Decimal
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User, Car, Wallet
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    DriverProfileSerializer,
    CarSerializer,
    WalletSerializer,
)


class RegisterView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class DriverProfileView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DriverProfileSerializer
    queryset = User.objects.all()
    lookup_field = "pk"


class MyCarsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cars = Car.objects.filter(owner=request.user)
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)


class ManageCarView(generics.ListCreateAPIView):
    """
    GET: Zwraca listę samochodów zalogowanego użytkownika.
    POST: Dodaje nowy samochód do konta zalogowanego użytkownika.
    """

    serializer_class = CarSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Car.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CarDeleteView(generics.DestroyAPIView):
    """Usuwa samochód należący do zalogowanego użytkownika."""

    serializer_class = CarSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Car.objects.filter(owner=self.request.user)


class WalletDetailView(APIView):
    """Zwraca stan portfela użytkownika."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        return Response(WalletSerializer(wallet).data)


class WalletTopUpView(APIView):
    """Symulowane doładowanie portfela."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount")
        if not amount:
            return Response(
                {"error": "Podaj kwotę doładowania."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                raise ValueError
        except (ValueError, Exception):
            return Response(
                {"error": "Kwota musi być liczbą dodatnią."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        wallet.balance += amount
        wallet.save()

        return Response(
            {
                "message": f"Doładowano portfel o {amount} PLN.",
                "balance": wallet.balance,
            },
            status=status.HTTP_200_OK,
        )
