from rest_framework import serializers
from .models import Ride, Transaction
from accounts.models import Location, Car
from accounts.serializers import UserSerializer, CarSerializer


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "city", "street", "st_number", "latitude", "longitude"]
        extra_kwargs = {
            "latitude": {"required": False},
            "longitude": {"required": False},
            "user": {"required": False},
            "postal_code": {"required": False},
        }


class RideDetailSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    start_location = LocationSerializer(read_only=True)
    end_location = LocationSerializer(read_only=True)

    class Meta:
        model = Ride
        fields = [
            "id",
            "driver",
            "car",
            "start_location",
            "end_location",
            "departure_date",
            "departure_time",
            "cost_per_passenger",
            "available_seats",
            "status",
        ]


class RideCreateSerializer(serializers.ModelSerializer):
    car_id = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(), source="car", write_only=True
    )
    start_location = LocationSerializer()
    end_location = LocationSerializer()

    class Meta:
        model = Ride
        fields = [
            "car_id",
            "start_location",
            "end_location",
            "departure_date",
            "departure_time",
            "cost_per_passenger",
            "available_seats",
        ]

    def create(self, validated_data):
        user = self.context["request"].user

        start_data = validated_data.pop("start_location")
        end_data = validated_data.pop("end_location")

        start_loc = Location.objects.create(
            user=user, latitude=0.0, longitude=0.0, postal_code="00-000", **start_data
        )
        end_loc = Location.objects.create(
            user=user, latitude=0.0, longitude=0.0, postal_code="00-000", **end_data
        )

        ride = Ride.objects.create(
            driver=user,
            start_location=start_loc,
            end_location=end_loc,
            status="active",
            **validated_data
        )
        return ride


class TransactionSerializer(serializers.ModelSerializer):
    source_email = serializers.SerializerMethodField()
    target_email = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "amount",
            "type",
            "transaction_date",
            "transaction_time",
            "source_email",
            "target_email",
        ]

    def get_source_email(self, obj):
        return obj.source_wallet.user.email if obj.source_wallet else None

    def get_target_email(self, obj):
        return obj.target_wallet.user.email if obj.target_wallet else None
