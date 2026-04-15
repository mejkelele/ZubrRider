import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-8xl font-bold text-zubr-dark mb-4">404</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Strona nie znaleziona</h1>
            <p className="text-gray-500 mb-8 max-w-md">
                Wygląda na to, że ta trasa nie istnieje. Może żubr ją zjadł? 🦬
            </p>
            <Link
                to="/"
                className="bg-zubr-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-zubr-hover transition shadow-lg"
            >
                Wróć na stronę główną
            </Link>
        </div>
    );
}

export default NotFound;