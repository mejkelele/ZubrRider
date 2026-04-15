import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Home() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useState({
        start_city: "",
        end_city: "",
        date: "",
    });

    const fetchRides = (params = {}) => {
        setLoading(true);
        const query = new URLSearchParams();
        if (params.start_city) query.set("start_city", params.start_city);
        if (params.end_city) query.set("end_city", params.end_city);
        if (params.date) query.set("date", params.date);

        const url = `/api/rides/${query.toString() ? "?" + query.toString() : ""}`;

        api.get(url)
            .then((response) => {
                setRides(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Błąd podczas pobierania przejazdów:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRides();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchRides(searchParams);
    };

    const handleClearSearch = () => {
        setSearchParams({ start_city: "", end_city: "", date: "" });
        fetchRides();
    };

    const getDriverDisplayName = (driver) => {
        if (driver?.first_name) return driver.first_name;
        if (driver?.username) return driver.username;
        return driver?.email || "Anonim";
    };

    const getDriverInitial = (driver) => {
        if (driver?.first_name) return driver.first_name[0].toUpperCase();
        if (driver?.email) return driver.email[0].toUpperCase();
        return "?";
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Hero Banner */}
            <div className="bg-zubr-dark rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-green-700 rounded-full opacity-50 blur-3xl"></div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Podróżuj po Choroszczy <br/>
                        <span className="text-zubr-gold">taniej i wygodniej</span>
                    </h1>
                    <p className="text-green-100 text-lg mb-8 opacity-90">
                        Znajdź wolne miejsce w samochodzie lub zabierz pasażerów.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/publish-ride"
                              className="bg-zubr-gold text-zubr-dark px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition shadow-lg">
                            Dodaj przejazd
                        </Link>
                        <a href="#rides"
                           className="border border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-zubr-dark transition">
                            Szukaj trasy
                        </a>
                    </div>
                </div>
            </div>

            {/* Formularz wyszukiwania */}
            <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 -mt-16 mx-4 md:mx-0 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Skąd</label>
                        <input
                            type="text"
                            placeholder="np. Białystok"
                            value={searchParams.start_city}
                            onChange={(e) => setSearchParams({...searchParams, start_city: e.target.value})}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-gold outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Dokąd</label>
                        <input
                            type="text"
                            placeholder="np. Choroszcz"
                            value={searchParams.end_city}
                            onChange={(e) => setSearchParams({...searchParams, end_city: e.target.value})}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-gold outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Kiedy</label>
                        <input
                            type="date"
                            value={searchParams.date}
                            onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-gold outline-none transition"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 bg-zubr-dark text-white py-3 rounded-lg font-bold hover:bg-zubr-hover transition shadow"
                        >
                            Szukaj
                        </button>
                        {(searchParams.start_city || searchParams.end_city || searchParams.date) && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition"
                                title="Wyczyść filtry"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* Lista przejazdów */}
            <div id="rides" className="mt-4">
                <h2 className="text-2xl font-bold text-zubr-dark mb-6 flex items-center gap-2">
                    Dostępne przejazdy
                    {!loading && <span className="text-sm font-normal text-gray-400">({rides.length})</span>}
                </h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-zubr-gold border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : rides.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg mb-2">Brak dostępnych przejazdów.</p>
                        <p className="text-gray-400 text-sm">Spróbuj zmienić kryteria wyszukiwania lub dodaj własny przejazd.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rides.map((ride) => (
                            <div key={ride.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 border border-gray-100 overflow-hidden group">
                                <div className="p-5 border-b border-gray-100 bg-gray-50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Start</span>
                                            <span className="font-bold text-gray-800 text-lg">{ride.start_location?.city || "Nieznane"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col mt-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cel</span>
                                        <span className="font-bold text-gray-800 text-lg">{ride.end_location?.city || "Nieznane"}</span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zubr-light flex items-center justify-center text-zubr-dark font-bold">
                                                {getDriverInitial(ride.driver)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{getDriverDisplayName(ride.driver)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-2xl font-bold text-zubr-dark">{ride.cost_per_passenger} PLN</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                                        <span>{ride.departure_date} o {ride.departure_time?.slice(0, 5)}</span>
                                        <span className="font-semibold text-green-600">Wolne: {ride.available_seats}</span>
                                    </div>
                                </div>

                                <Link 
                                    to={`/ride/${ride.id}`}
                                    className="block bg-zubr-dark text-white text-center py-3 font-bold cursor-pointer hover:bg-green-800 transition"
                                >
                                    Zobacz szczegóły / Rezerwuj
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;