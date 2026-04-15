import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function UserPage() {
    const [user, setUser] = useState(null);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Stan edycji profilu
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    // Stan dodawania auta
    const [newCar, setNewCar] = useState({ brand: "", model: "", license_plate: "", seats: 4 });
    const [isAddingCar, setIsAddingCar] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, carsRes] = await Promise.all([
                api.get("/api/accounts/profile/"),
                api.get("/api/accounts/my-cars/")
            ]);
            setUser(profileRes.data);
            setEditData(profileRes.data); // Kopia do edycji
            setCars(carsRes.data);
        } catch (error) {
            console.error(error);
            alert("Nie udało się pobrać danych profilu.");
        } finally {
            setLoading(false);
        }
    };

    // Obsługa Profilu
    const handleProfileChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.patch("/api/accounts/profile/", editData);
            setUser(res.data);
            setIsEditing(false);
            alert("Profil zaktualizowany!");
        } catch (error) {
            console.error(error);
            alert("Błąd podczas aktualizacji profilu.");
        }
    };

    // Obsługa Aut
    const handleCarChange = (e) => {
        setNewCar({ ...newCar, [e.target.name]: e.target.value });
    };

    const handleAddCar = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/api/accounts/car/", newCar);
            setCars([...cars, res.data]);
            setNewCar({ brand: "", model: "", license_plate: "", seats: 4 });
            setIsAddingCar(false);
            alert("Auto dodane pomyślnie!");
        } catch (error) {
            console.error(error);
            alert("Wystąpił błąd przy dodawaniu auta.");
        }
    };

    const handleDeleteCar = async (carId) => {
        if (!window.confirm("Na pewno chcesz usunąć to auto?")) return;
        try {
            await api.delete(`/api/accounts/car/${carId}/`);
            setCars(cars.filter(c => c.id !== carId));
        } catch (error) {
            console.error(error);
            alert("Wystąpił błąd przy usuwaniu auta.");
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Ładowanie profilu...</div>;
    }

    if (!user) {
        return <div className="text-center mt-10">Brak danych użytkownika.</div>;
    }

    const getInitials = () => {
        const first = user.first_name ? user.first_name[0] : "";
        const last = user.last_name ? user.last_name[0] : "";
        const login = user.username ? user.username[0] : "?";
        return (first + last) || login;
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Nagłówek profilu */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border-t-4 border-zubr-gold">
                <div className="bg-zubr-dark h-32 w-full relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center text-zubr-dark text-3xl font-bold uppercase shadow-md">
                            {getInitials()}
                        </div>
                    </div>
                </div>
                <div className="pt-14 pb-8 px-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {user.first_name} {user.last_name}
                        </h1>
                        <p className="text-gray-500">@{user.username || "użytkownik"}</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Dołączył: {new Date(user.date_joined).toLocaleDateString()}
                        </p>
                    </div>
                    <button 
                        onClick={() => {
                            if (isEditing) setEditData(user); // reset
                            setIsEditing(!isEditing);
                        }}
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                            isEditing ? "bg-gray-200 text-gray-700" : "bg-zubr-dark text-white hover:bg-zubr-hover"
                        }`}
                    >
                        {isEditing ? "Anuluj Edycję" : "Edytuj Profil"}
                    </button>
                </div>
            </div>

            {/* Formularz Edycji lub Widok Danych */}
            {isEditing ? (
                <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-xl shadow-md mb-8 border border-zubr-gold">
                    <h2 className="text-xl font-bold text-zubr-dark mb-4 border-b border-gray-100 pb-2">
                        Edycja Danych
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Imię</label>
                            <input name="first_name" value={editData.first_name || ""} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nazwisko</label>
                            <input name="last_name" value={editData.last_name || ""} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Telefon</label>
                            <input name="phone" value={editData.phone || ""} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Miasto</label>
                            <input name="city" value={editData.city || ""} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Kod pocztowy</label>
                            <input name="postal_code" value={editData.postal_code || ""} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Ulica</label>
                            <input name="street" value={editData.street || ""} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-600 mb-1">Nr domu</label>
                                <input name="st_number" value={editData.st_number || ""} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-gray-600 mb-1">Nr lokalu</label>
                                <input name="apt_number" value={editData.apt_number || ""} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 text-right">
                        <button type="submit" className="bg-zubr-gold text-zubr-dark px-6 py-2 rounded-lg font-bold hover:bg-yellow-400">
                            Zapisz Zmiany
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Karta: Dane kontaktowe */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-zubr-dark mb-4 border-b border-gray-100 pb-2">
                            Dane kontaktowe
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Email</span>
                                <span className="text-gray-700">{user.email}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Telefon</span>
                                <span className="text-gray-700">{user.phone || "Nie podano"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Karta: Adres */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-zubr-dark mb-4 border-b border-gray-100 pb-2">
                            Adres zamieszkania
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Miasto</span>
                                <span className="text-gray-700">
                                    {user.postal_code} {user.city || "Nie podano"}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Ulica</span>
                                <span className="text-gray-700">
                                    {user.street ? `ul. ${user.street} ${user.st_number}` : "Nie podano"}
                                    {user.apt_number && ` / ${user.apt_number}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEKCJA SAMOCHODÓW */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
                    <h2 className="text-2xl font-bold text-zubr-dark">Moje Pojazdy</h2>
                    <button 
                        onClick={() => setIsAddingCar(!isAddingCar)}
                        className="bg-zubr-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-800 transition"
                    >
                        {isAddingCar ? "Anuluj" : "+ Dodaj Auto"}
                    </button>
                </div>

                {isAddingCar && (
                    <form onSubmit={handleAddCar} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Marka</label>
                                <input name="brand" required placeholder="np. Toyota" value={newCar.brand} onChange={handleCarChange} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Model</label>
                                <input name="model" required placeholder="np. Yaris" value={newCar.model} onChange={handleCarChange} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Rejestracja</label>
                                <input name="license_plate" required placeholder="np. BIA 12345" value={newCar.license_plate} onChange={handleCarChange} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Ilość miejsc</label>
                                <input type="number" min="1" max="9" name="seats" required value={newCar.seats} onChange={handleCarChange} className="w-full p-2 border rounded text-sm" />
                            </div>
                        </div>
                        <button type="submit" className="mt-4 bg-zubr-gold text-zubr-dark font-bold px-6 py-2 rounded shadow text-sm hover:bg-yellow-400">
                            Zapisz Pojazd
                        </button>
                    </form>
                )}

                {cars.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">Brak dodanych pojazdów. Dodaj auto, aby zaoferować przejazd.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cars.map(car => (
                            <div key={car.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition">
                                <div>
                                    <p className="font-bold text-lg text-gray-800">{car.brand} {car.model}</p>
                                    <p className="text-sm text-gray-500">{car.license_plate} • Miejsc: {car.seats}</p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteCar(car.id)}
                                    className="text-red-500 hover:text-red-700 font-bold p-2"
                                    title="Usuń auto"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
        </div>
    );
}

export default UserPage;