import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

function RideDetails() {
    const { id } = useParams();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(null);
    const [seatCount, setSeatCount] = useState(1);
    const [booking, setBooking] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState("");
    const navigate = useNavigate();

    // Chat
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatError, setChatError] = useState("");
    const [showChat, setShowChat] = useState(false);
    const chatEndRef = useRef(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Rating
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingMessage, setRatingMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rideRes, walletRes, profileRes] = await Promise.all([
                    api.get(`/api/rides/${id}/`),
                    api.get("/api/accounts/wallet/"),
                    api.get("/api/accounts/profile/"),
                ]);
                setRide(rideRes.data);
                setWalletBalance(walletRes.data.balance);
                setCurrentUserId(profileRes.data.id);
            } catch (error) {
                console.error("Błąd ładowania danych:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Polling wiadomości co 5 sekund
    useEffect(() => {
        if (!showChat) return;

        const fetchMessages = () => {
            api.get(`/api/community/messages/${id}/`)
                .then(res => {
                    setMessages(res.data);
                    setChatError("");
                })
                .catch(err => {
                    if (err.response?.status === 403) {
                        setChatError("Musisz mieć rezerwację aby korzystać z czatu.");
                    }
                });
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [id, showChat]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleBooking = async () => {
        setBooking(true);
        setBookingError("");
        setBookingSuccess("");

        try {
            const res = await api.post(`/api/rides/${id}/book/`, { seat_count: seatCount });
            setBookingSuccess(res.data.message);
            // Odśwież dane
            const [rideRes, walletRes] = await Promise.all([
                api.get(`/api/rides/${id}/`),
                api.get("/api/accounts/wallet/"),
            ]);
            setRide(rideRes.data);
            setWalletBalance(walletRes.data.balance);
        } catch (error) {
            setBookingError(error.response?.data?.error || "Wystąpił błąd przy rezerwacji.");
        } finally {
            setBooking(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post(`/api/community/messages/${id}/`, { content: newMessage });
            setNewMessage("");
            // Odśwież wiadomości
            const res = await api.get(`/api/community/messages/${id}/`);
            setMessages(res.data);
        } catch (error) {
            setChatError(error.response?.data?.error || "Nie udało się wysłać wiadomości.");
        }
    };

    const handleRateDriver = async (e) => {
        e.preventDefault();
        setRatingSubmitting(true);
        setRatingMessage("");
        
        try {
            await api.post(`/api/community/rate/`, {
                ride: ride.id,
                rated_user: ride.driver.id,
                score: ratingScore,
                comment: ratingComment
            });
            setRatingMessage("Dziękujemy za wystawienie oceny!");
            setTimeout(() => setRatingModalOpen(false), 2000);
        } catch (error) {
            setRatingMessage(error.response?.data?.error || "Wystąpił błąd.");
        } finally {
            setRatingSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-zubr-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!ride) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Nie znaleziono przejazdu.</p>
                <Link to="/" className="text-zubr-dark font-bold hover:underline mt-4 inline-block">
                    Wróć na stronę główną
                </Link>
            </div>
        );
    }

    const isDriver = currentUserId === ride.driver?.id;
    const totalCost = (parseFloat(ride.cost_per_passenger) * seatCount).toFixed(2);

    return (
        <div className="max-w-4xl mx-auto pb-12">
            
            {/* Nagłówek Trasy */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-l-8 border-zubr-gold">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <div className="flex items-center gap-3 text-zubr-dark mb-1">
                            <span className="font-bold text-2xl">{ride.start_location?.city}</span>
                            <span className="text-2xl">➝</span>
                            <span className="font-bold text-2xl">{ride.end_location?.city}</span>
                        </div>
                        <p className="text-gray-500">
                            {ride.departure_date} o godz. {ride.departure_time?.slice(0, 5)}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                        <span className="block text-3xl font-bold text-zubr-dark">
                            {ride.cost_per_passenger} PLN
                        </span>
                        <span className="text-sm text-gray-500">za osobę</span>
                    </div>
                </div>
                {ride.status !== "active" && (
                    <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-bold ${
                        ride.status === "full" ? "bg-orange-100 text-orange-700" :
                        ride.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                    }`}>
                        Status: {ride.status === "full" ? "Brak wolnych miejsc" : ride.status === "cancelled" ? "Anulowany" : ride.status}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Lewa kolumna: Szczegóły + Kierowca */}
                <div className="md:col-span-2 space-y-6">

                    {/* Adresy */}
                    <div className="bg-white p-6 rounded-xl shadow-md relative overflow-hidden">
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"></div>
                        
                        <div className="relative pl-8 mb-8">
                            <div className="absolute left-0 top-1 w-3 h-3 bg-green-600 rounded-full ring-4 ring-white"></div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase">Start</h3>
                            <p className="font-bold text-lg text-gray-800">
                                ul. {ride.start_location?.street} {ride.start_location?.st_number}
                            </p>
                            <p className="text-gray-600">{ride.start_location?.city}</p>
                        </div>

                        <div className="relative pl-8">
                            <div className="absolute left-0 top-1 w-3 h-3 bg-red-500 rounded-full ring-4 ring-white"></div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase">Koniec</h3>
                            <p className="font-bold text-lg text-gray-800">
                                ul. {ride.end_location?.street} {ride.end_location?.st_number}
                            </p>
                            <p className="text-gray-600">{ride.end_location?.city}</p>
                        </div>
                    </div>

                    {/* O Kierowcy */}
                    <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-zubr-dark rounded-full flex items-center justify-center text-white text-xl font-bold">
                                {ride.driver?.first_name ? ride.driver.first_name[0] : "?"}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{ride.driver?.first_name || "Kierowca"} {ride.driver?.last_name || ""}</h3>
                                <Link to={`/driver/${ride.driver?.id}`} className="text-sm text-zubr-dark hover:underline font-semibold">
                                    Zobacz profil kierowcy
                                </Link>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Samochód</p>
                            <p className="font-bold">{ride.car?.brand} {ride.car?.model}</p>
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="w-full p-4 text-left font-bold text-zubr-dark flex justify-between items-center hover:bg-gray-50 transition"
                        >
                            <span>💬 Wiadomości</span>
                            <span className="text-gray-400">{showChat ? "▲" : "▼"}</span>
                        </button>

                        {showChat && (
                            <div className="border-t border-gray-100">
                                {chatError ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">{chatError}</div>
                                ) : (
                                    <>
                                        <div className="max-h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                            {messages.length === 0 ? (
                                                <p className="text-center text-gray-400 text-sm py-4">Brak wiadomości. Rozpocznij konwersację!</p>
                                            ) : (
                                                messages.map((msg) => (
                                                    <div key={msg.id} className={`flex ${msg.sender === currentUserId ? "justify-end" : "justify-start"}`}>
                                                        <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                                                            msg.sender === currentUserId
                                                                ? "bg-zubr-dark text-white rounded-br-md"
                                                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                                                        }`}>
                                                            {msg.sender !== currentUserId && (
                                                                <p className="text-xs font-bold text-zubr-gold mb-1">{msg.sender_name || "Użytkownik"}</p>
                                                            )}
                                                            <p>{msg.content}</p>
                                                            <p className="text-xs opacity-60 mt-1">{new Date(msg.sent_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            <div ref={chatEndRef} />
                                        </div>
                                        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Napisz wiadomość..."
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                                            />
                                            <button
                                                type="submit"
                                                className="bg-zubr-dark text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-zubr-hover transition"
                                            >
                                                Wyślij
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Prawa kolumna: Rezerwacja */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-md sticky top-24 space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">Podsumowanie</h3>
                        
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <span className="text-gray-600">Dostępne miejsca</span>
                            <span className="font-bold text-green-600">{ride.available_seats}</span>
                        </div>

                        {/* Stan portfela */}
                        {walletBalance !== null && (
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <span className="text-gray-600">Twój portfel</span>
                                <span className="font-bold text-zubr-dark">{parseFloat(walletBalance).toFixed(2)} PLN</span>
                            </div>
                        )}

                        {/* Wybór miejsc + rezerwacja */}
                        {!isDriver && ride.status === "active" && ride.available_seats > 0 && (
                            <>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Liczba miejsc</label>
                                    <select
                                        value={seatCount}
                                        onChange={(e) => setSeatCount(parseInt(e.target.value))}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-zubr-gold outline-none"
                                    >
                                        {[...Array(ride.available_seats)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Razem:</span>
                                    <span className="text-zubr-dark">{totalCost} PLN</span>
                                </div>

                                {bookingError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                                        {bookingError}
                                    </div>
                                )}
                                {bookingSuccess && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
                                        {bookingSuccess}
                                    </div>
                                )}

                                <button 
                                    className={`w-full py-3 rounded-lg font-bold text-lg transition shadow-md ${
                                        booking
                                            ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                            : "bg-zubr-gold text-zubr-dark hover:bg-yellow-400"
                                    }`}
                                    onClick={handleBooking}
                                    disabled={booking}
                                >
                                    {booking ? "Rezerwowanie..." : "Zarezerwuj miejsce"}
                                </button>

                                {walletBalance !== null && parseFloat(walletBalance) < parseFloat(totalCost) && (
                                    <Link to="/wallet" className="block text-center text-sm text-red-600 hover:underline font-semibold">
                                        ⚠️ Niewystarczające środki — doładuj portfel
                                    </Link>
                                )}
                            </>
                        )}

                        {isDriver && (
                            <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                To jest Twój przejazd. Zarządzaj nim w zakładce "Moje Przejazdy".
                            </div>
                        )}

                        {/* Ocena dla starych przejazdów */}
                        {!isDriver && ride.status !== "active" && (
                            <button
                                onClick={() => setRatingModalOpen(true)}
                                className="w-full mt-4 bg-gray-800 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition"
                            >
                                ⭐ Oceń kierowcę
                            </button>
                        )}

                        <p className="text-xs text-center text-gray-400 mt-3">
                            Płatność z portfela. Środki zostaną pobrane natychmiast.
                        </p>
                    </div>
                </div>

            </div>

            {/* Modal oceny */}
            {ratingModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                        <button 
                            onClick={() => setRatingModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 font-bold"
                        >✕</button>
                        
                        <h2 className="text-2xl font-bold text-zubr-dark mb-4">Oceń Przejazd</h2>
                        {ratingMessage && (
                            <div className={`p-3 mb-4 rounded-lg text-sm ${ratingMessage.includes("Dziękujemy") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {ratingMessage}
                            </div>
                        )}

                        <form onSubmit={handleRateDriver}>
                            <div className="mb-4">
                                <label className="block text-sm text-gray-600 mb-1">Ocena (1-5)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star} 
                                            type="button"
                                            onClick={() => setRatingScore(star)}
                                            className={`w-10 h-10 rounded-full text-lg font-bold transition ${ratingScore >= star ? "bg-zubr-gold text-zubr-dark" : "bg-gray-100 text-gray-400"}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm text-gray-600 mb-1">Komentarz (opcjonalnie)</label>
                                <textarea 
                                    value={ratingComment}
                                    onChange={(e) => setRatingComment(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-zubr-gold"
                                    rows="3"
                                ></textarea>
                            </div>
                            <button 
                                type="submit"
                                disabled={ratingSubmitting || ratingMessage.includes("Dziękujemy")}
                                className="w-full bg-zubr-dark text-white font-bold py-3 rounded-lg hover:bg-green-800 transition disabled:opacity-50"
                            >
                                {ratingSubmitting ? "Wysyłanie..." : "Wyślij Ocenę"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RideDetails;