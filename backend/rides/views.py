from django.db import transaction
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Ride, Booking, Transaction
from .serializers import RideDetailSerializer, RideCreateSerializer, TransactionSerializer
from accounts.models import Wallet
from community.models import Alert
import datetime


class RideDetailView(generics.RetrieveAPIView):
    queryset = Ride.objects.all()
    serializer_class = RideDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "pk"


class RideCreateView(generics.CreateAPIView):
    queryset = Ride.objects.all()
    serializer_class = RideCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        self.perform_create(serializer)
        return Response(serializer.data, status=201)


class MyRidesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        driver_rides = Ride.objects.filter(driver=user).order_by("-departure_date")
        passenger_rides = (
            Ride.objects.filter(bookings__passenger=user)
            .distinct()
            .order_by("-departure_date")
        )
        return Response(
            {
                "as_driver": RideDetailSerializer(driver_rides, many=True).data,
                "as_passenger": RideDetailSerializer(passenger_rides, many=True).data,
            }
        )


class RideListView(generics.ListAPIView):
    """Zwraca wszystkie aktywne przejazdy dla strony głównej"""

    serializer_class = RideDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Ride.objects.filter(status="active").order_by("departure_date")

        # Filtrowanie po parametrach GET
        start_city = self.request.query_params.get("start_city")
        end_city = self.request.query_params.get("end_city")
        date = self.request.query_params.get("date")

        if start_city:
            qs = qs.filter(start_location__city__icontains=start_city)
        if end_city:
            qs = qs.filter(end_location__city__icontains=end_city)
        if date:
            qs = qs.filter(departure_date=date)

        return qs


class BookRideView(views.APIView):
    """Odpowiada za rezerwację i pobranie środków z portfela (Wallet)"""

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            ride = Ride.objects.select_for_update().get(pk=pk, status="active")
        except Ride.DoesNotExist:
            return Response(
                {"error": "Przejazd nie istnieje lub jest już pełny."},
                status=status.HTTP_404_NOT_FOUND,
            )

        seat_count = int(request.data.get("seat_count", 1))

        if ride.available_seats < seat_count:
            return Response(
                {"error": "Brak wystarczającej liczby wolnych miejsc."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if ride.driver == request.user:
            return Response(
                {"error": "Nie możesz zarezerwować własnego przejazdu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sprawdź czy już nie zarezerwował
        existing_booking = Booking.objects.filter(
            ride=ride, passenger=request.user, status="confirmed"
        ).first()
        if existing_booking:
            return Response(
                {"error": "Już masz rezerwację na ten przejazd."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total_cost = ride.cost_per_passenger * seat_count

        passenger_wallet, _ = Wallet.objects.get_or_create(user=request.user)
        driver_wallet, _ = Wallet.objects.get_or_create(user=ride.driver)

        if passenger_wallet.balance < total_cost:
            return Response(
                {"error": "Brak wystarczających środków w portfelu. Doładuj konto."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Transfer środków
        passenger_wallet.balance -= total_cost
        passenger_wallet.save()

        driver_wallet.balance += total_cost
        driver_wallet.save()

        # 2. Utworzenie rezerwacji
        booking = Booking.objects.create(
            ride=ride, passenger=request.user, seat_count=seat_count, status="confirmed"
        )

        # 3. Zapisanie historii transakcji
        Transaction.objects.create(
            source_wallet=passenger_wallet,
            target_wallet=driver_wallet,
            booking=booking,
            amount=total_cost,
            type="payment",
            transaction_date=datetime.date.today(),
            transaction_time=datetime.datetime.now().time(),
        )

        # 4. Aktualizacja miejsc
        ride.available_seats -= seat_count
        if ride.available_seats == 0:
            ride.status = "full"
        ride.save()

        # 5. Alert dla kierowcy
        Alert.objects.create(
            user=ride.driver,
            content=f"Nowa rezerwacja! {request.user.first_name or request.user.email} zarezerwował {seat_count} miejsc(e).",
            link=f"/ride/{ride.id}",
        )

        return Response(
            {"message": "Rezerwacja zakończona sukcesem!", "booking_id": booking.id},
            status=status.HTTP_201_CREATED,
        )


class CancelBookingView(views.APIView):
    """Anulowanie rezerwacji z zwrotem środków."""

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            booking = Booking.objects.select_for_update().get(
                pk=pk, passenger=request.user, status="confirmed"
            )
        except Booking.DoesNotExist:
            return Response(
                {"error": "Rezerwacja nie istnieje lub została już anulowana."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ride = Ride.objects.select_for_update().get(pk=booking.ride.pk)
        total_refund = ride.cost_per_passenger * booking.seat_count

        # Zwrot środków
        passenger_wallet, _ = Wallet.objects.get_or_create(user=request.user)
        driver_wallet, _ = Wallet.objects.get_or_create(user=ride.driver)

        passenger_wallet.balance += total_refund
        passenger_wallet.save()

        driver_wallet.balance -= total_refund
        driver_wallet.save()

        # Zapis transakcji zwrotu
        Transaction.objects.create(
            source_wallet=driver_wallet,
            target_wallet=passenger_wallet,
            booking=booking,
            amount=total_refund,
            type="refund",
            transaction_date=datetime.date.today(),
            transaction_time=datetime.datetime.now().time(),
        )

        # Aktualizacja
        booking.status = "cancelled"
        booking.save()

        ride.available_seats += booking.seat_count
        if ride.status == "full":
            ride.status = "active"
        ride.save()

        # Alert dla kierowcy
        Alert.objects.create(
            user=ride.driver,
            content=f"{request.user.first_name or request.user.email} anulował rezerwację na przejazd.",
            link=f"/ride/{ride.id}",
        )

        return Response(
            {"message": "Rezerwacja anulowana. Środki zwrócone."},
            status=status.HTTP_200_OK,
        )


class CancelRideView(views.APIView):
    """Anulowanie przejazdu przez kierowcę — zwrot środków wszystkim pasażerom."""

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            ride = Ride.objects.select_for_update().get(pk=pk, driver=request.user)
        except Ride.DoesNotExist:
            return Response(
                {"error": "Przejazd nie istnieje lub nie jesteś jego kierowcą."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if ride.status == "cancelled":
            return Response(
                {"error": "Przejazd jest już anulowany."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Zwrot środków dla każdego pasażera
        bookings = Booking.objects.filter(ride=ride, status="confirmed")
        driver_wallet, _ = Wallet.objects.get_or_create(user=request.user)

        for booking in bookings:
            refund = ride.cost_per_passenger * booking.seat_count
            passenger_wallet, _ = Wallet.objects.get_or_create(user=booking.passenger)

            passenger_wallet.balance += refund
            passenger_wallet.save()

            driver_wallet.balance -= refund
            driver_wallet.save()

            Transaction.objects.create(
                source_wallet=driver_wallet,
                target_wallet=passenger_wallet,
                booking=booking,
                amount=refund,
                type="refund",
                transaction_date=datetime.date.today(),
                transaction_time=datetime.datetime.now().time(),
            )

            booking.status = "cancelled"
            booking.save()

            # Alert dla pasażera
            Alert.objects.create(
                user=booking.passenger,
                content=f"Przejazd {ride.start_location.city} → {ride.end_location.city} został anulowany przez kierowcę. Środki zostały zwrócone.",
                link=f"/my-rides",
            )

        ride.status = "cancelled"
        ride.save()

        return Response(
            {"message": "Przejazd anulowany. Środki zwrócone wszystkim pasażerom."},
            status=status.HTTP_200_OK,
        )


class WalletBalanceView(views.APIView):
    """Zwraca obecny stan konta użytkownika"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        return Response({"balance": wallet.balance})


class TransactionHistoryView(generics.ListAPIView):
    """Historia transakcji użytkownika."""

    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        return Transaction.objects.filter(
            source_wallet=wallet
        ).union(
            Transaction.objects.filter(target_wallet=wallet)
        ).order_by("-transaction_date", "-transaction_time")


class RideBookingsView(views.APIView):
    """Zwraca listę rezerwacji dla danego przejazdu (tylko dla kierowcy)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            ride = Ride.objects.get(pk=pk)
        except Ride.DoesNotExist:
            return Response(
                {"error": "Przejazd nie istnieje."},
                status=status.HTTP_404_NOT_FOUND,
            )

        bookings = Booking.objects.filter(ride=ride, status="confirmed")
        data = [
            {
                "id": b.id,
                "passenger_id": b.passenger.id,
                "passenger_name": f"{b.passenger.first_name} {b.passenger.last_name}".strip() or b.passenger.email,
                "passenger_email": b.passenger.email,
                "seat_count": b.seat_count,
                "status": b.status,
            }
            for b in bookings
        ]
        return Response(data)
