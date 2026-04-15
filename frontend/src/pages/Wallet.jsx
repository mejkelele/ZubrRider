import { useState, useEffect } from "react";
import api from "../api";

function Wallet() {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        try {
            const res = await api.get("/api/accounts/wallet/");
            setBalance(res.data.balance);
        } catch (err) {
            console.error(err);
            setError("Nie udało się pobrać stanu portfela.");
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async (valueToTopUp) => {
        setAdding(true);
        setMessage("");
        setError("");
        
        try {
            const res = await api.post("/api/accounts/wallet/top-up/", { amount: valueToTopUp });
            setBalance(res.data.balance);
            setMessage(`Doładowano portfel kwotą ${valueToTopUp} PLN.`);
            setAmount("");
        } catch (err) {
            setError(err.response?.data?.error || "Nie udało się doładować konta.");
        } finally {
            setAdding(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError("Wpisz prawidłową wartość dodatnią.");
            return;
        }
        handleTopUp(amount);
    };

    if (loading) return <div className="text-center mt-10">Ładowanie portfela...</div>;

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <h1 className="text-3xl font-bold text-zubr-dark mb-6 text-center">Twój Portfel</h1>
            
            {/* Aktualny Stan */}
            <div className="bg-gradient-to-r from-zubr-dark to-green-900 rounded-2xl shadow-xl overflow-hidden mb-8 text-white relative">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="p-8">
                    <p className="text-green-100 text-lg opacity-90 mb-1">Dostępne środki</p>
                    <div className="text-5xl font-bold mb-4 drop-shadow-md">
                        {balance !== null ? parseFloat(balance).toFixed(2) : "0.00"} <span className="text-3xl text-zubr-gold">PLN</span>
                    </div>
                    <p className="text-sm opacity-80 border-t border-green-700 mx-auto pt-4 max-w-sm">Dzięki środkom w portfelu błyskawicznie opłacisz każdy przejazd.</p>
                </div>
            </div>

            {/* Powiadomienia */}
            {message && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 shadow-sm">{message}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 shadow-sm">{error}</div>}

            {/* Doładowanie */}
            <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-zubr-gold">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Doładuj środki</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[20, 50, 100, 200].map(val => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => handleTopUp(val)}
                            disabled={adding}
                            className={`py-3 rounded-lg font-bold border-2 transition hover:bg-zubr-gold hover:text-zubr-dark hover:border-zubr-gold ${adding ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400" : "border-gray-200 text-gray-700"}`}
                        >
                            +{val} PLN
                        </button>
                    ))}
                </div>

                <div className="relative border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500 mb-3 text-center">Albo wprowadź własną kwotę</p>
                    <form onSubmit={handleSubmit} className="flex gap-4 max-w-sm mx-auto">
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Kwota"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={adding}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zubr-gold outline-none text-lg text-center"
                        />
                        <button
                            type="submit"
                            disabled={adding}
                            className={`bg-zubr-dark text-white px-6 rounded-lg font-bold transition hover:bg-zubr-hover shadow ${adding ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {adding ? "Przetwarzanie..." : "Wpłać"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Wallet;
