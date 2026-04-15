from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Rating, Message, Alert
from .serializers import RatingSerializer, MessageSerializer, AlertSerializer
from rides.models import Ride, Booking


class CreateRatingView(APIView):
    """Dodawanie oceny po przejeździe."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ride_id = request.data.get("ride")
        rated_user_id = request.data.get("rated_user")
        score = request.data.get("score")
        comment = request.data.get("comment", "")

        if not all([ride_id, rated_user_id, score]):
            return Response(
                {"error": "Wymagane pola: ride, rated_user, score."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ride = Ride.objects.get(pk=ride_id)
        except Ride.DoesNotExist:
            return Response(
                {"error": "Przejazd nie istnieje."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Sprawdzenie czy user brał udział w przejeździe
        is_driver = ride.driver == request.user
        is_passenger = Booking.objects.filter(
            ride=ride, passenger=request.user, status="confirmed"
        ).exists()

        if not is_driver and not is_passenger:
            return Response(
                {"error": "Nie brałeś udziału w tym przejeździe."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Nie można oceniać samego siebie
        if str(rated_user_id) == str(request.user.id):
            return Response(
                {"error": "Nie możesz oceniać samego siebie."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sprawdzenie czy już nie ocenił
        if Rating.objects.filter(
            ride=ride, rater=request.user, rated_user_id=rated_user_id
        ).exists():
            return Response(
                {"error": "Już oceniłeś tę osobę w tym przejeździe."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RatingSerializer(
            data={
                "ride": ride_id,
                "rated_user": rated_user_id,
                "score": score,
                "comment": comment,
            }
        )
        if serializer.is_valid():
            serializer.save(rater=request.user)

            # Utwórz alert dla ocenianego
            Alert.objects.create(
                user_id=rated_user_id,
                content=f"Otrzymałeś nową ocenę {score}/5 od {request.user.first_name or request.user.email}",
                link=f"/driver/{rated_user_id}",
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyAlertsView(generics.ListAPIView):
    """Zwraca alerty użytkownika (od najnowszych)."""

    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user).order_by("-created_at")


class UnreadAlertsCountView(APIView):
    """Zwraca liczbę nieprzeczytanych alertów."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Alert.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})


class MarkAlertReadView(APIView):
    """Oznacza alert jako przeczytany."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk, user=request.user)
        except Alert.DoesNotExist:
            return Response(
                {"error": "Alert nie istnieje."},
                status=status.HTTP_404_NOT_FOUND,
            )
        alert.is_read = True
        alert.save()
        return Response({"message": "Alert oznaczony jako przeczytany."})


class MarkAllAlertsReadView(APIView):
    """Oznacza wszystkie alerty jako przeczytane."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Alert.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "Wszystkie alerty oznaczone jako przeczytane."})


class RideMessagesView(APIView):
    """GET: Lista wiadomości dla przejazdu. POST: Wyślij wiadomość."""

    permission_classes = [IsAuthenticated]

    def get(self, request, ride_id):
        try:
            ride = Ride.objects.get(pk=ride_id)
        except Ride.DoesNotExist:
            return Response(
                {"error": "Przejazd nie istnieje."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Tylko uczestnicy przejazdu mogą czytać wiadomości
        is_driver = ride.driver == request.user
        is_passenger = Booking.objects.filter(
            ride=ride, passenger=request.user, status="confirmed"
        ).exists()

        if not is_driver and not is_passenger:
            return Response(
                {"error": "Nie masz dostępu do wiadomości tego przejazdu."},
                status=status.HTTP_403_FORBIDDEN,
            )

        messages = Message.objects.filter(ride=ride).order_by("sent_at")
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, ride_id):
        try:
            ride = Ride.objects.get(pk=ride_id)
        except Ride.DoesNotExist:
            return Response(
                {"error": "Przejazd nie istnieje."},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_driver = ride.driver == request.user
        is_passenger = Booking.objects.filter(
            ride=ride, passenger=request.user, status="confirmed"
        ).exists()

        if not is_driver and not is_passenger:
            return Response(
                {"error": "Nie masz dostępu do wiadomości tego przejazdu."},
                status=status.HTTP_403_FORBIDDEN,
            )

        content = request.data.get("content", "").strip()
        if not content:
            return Response(
                {"error": "Wiadomość nie może być pusta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Receiver: kierowca jeśli sender jest pasażerem, inaczej broadcast do wszystkich
        receiver = ride.driver if not is_driver else None
        if is_driver:
            # Kierowca wysyła do wszystkich pasażerów — zapisujemy jako wiadomość do pierwszego pasażera
            # (w uproszczeniu — chat grupowy)
            first_booking = Booking.objects.filter(ride=ride, status="confirmed").first()
            if first_booking:
                receiver = first_booking.passenger
            else:
                return Response(
                    {"error": "Brak pasażerów w tym przejeździe."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        message = Message.objects.create(
            sender=request.user,
            receiver=receiver,
            ride=ride,
            content=content,
        )

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )
