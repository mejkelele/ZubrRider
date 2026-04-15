import { Link } from "react-router-dom";

function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[#1a2e1b] text-green-100 py-10 mt-auto border-t-4 border-zubr-gold">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-zubr-gold mb-3">Żubr Rider</h3>
                        <p className="text-green-200 text-sm leading-relaxed">
                            Aplikacja carpoolingowa dla mieszkańców Choroszczy i okolic.
                            Podróżuj taniej, wygodniej i ekologicznie.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-3">Nawigacja</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-zubr-gold transition">Szukaj przejazdów</Link></li>
                            <li><Link to="/publish-ride" className="hover:text-zubr-gold transition">Dodaj przejazd</Link></li>
                            <li><Link to="/my-rides" className="hover:text-zubr-gold transition">Moje przejazdy</Link></li>
                            <li><Link to="/profile" className="hover:text-zubr-gold transition">Profil</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-3">Informacje</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="text-green-300">📍 Choroszcz, Podlaskie</li>
                            <li className="text-green-300">🦬 Projekt studencki</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-green-800 pt-6 text-center">
                    <p className="font-semibold text-lg">&copy; {year} Żubr Rider. Wszelkie prawa zastrzeżone.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;