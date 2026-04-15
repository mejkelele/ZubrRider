import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import api from "../api";

import logo from "../assets/logo_clear.svg";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = localStorage.getItem(ACCESS_TOKEN);
    const [hoveredTab, setHoveredTab] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadAlerts, setUnreadAlerts] = useState(0);

    // Pobieranie liczby nieprzeczytanych alertów
    useEffect(() => {
        if (isAuthenticated) {
            const fetchAlerts = () => {
                api.get("/api/community/alerts/unread-count/")
                    .then(res => setUnreadAlerts(res.data.unread_count))
                    .catch(() => {});
            };
            fetchAlerts();
            const interval = setInterval(fetchAlerts, 30000); // polling co 30s
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const links = isAuthenticated
        ? [
            { name: "Szukaj", path: "/" },
            { name: "Dodaj", path: "/publish-ride" },
            { name: "Moje Przejazdy", path: "/my-rides" },
            { name: "Portfel", path: "/wallet" },
            { name: "Profil", path: "/profile" },
            { name: "Wyloguj", path: "#logout", action: handleLogout },
        ]
        : [
            { name: "Logowanie", path: "/login" },
            { name: "Rejestracja", path: "/register" },
        ];

    return (
        <>
            {/* DESKTOP NAVBAR */}
            <div className="fixed top-6 inset-x-0 z-50 hidden lg:flex justify-center px-4">
                <div className="flex items-center gap-2 p-3 bg-zubr-dark/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">

                    <Link
                        to="/"
                        className="px-4 py-2 mr-2 flex items-center hover:opacity-80 transition-opacity border-r border-white/10"
                    >
                        <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
                    </Link>

                    {links.map((link) => {
                        const isActive = location.pathname === link.path;
                        const isHovered = hoveredTab === link.path;
                        const isLogout = link.name === "Wyloguj";

                        return (
                            <div
                                key={link.path}
                                onMouseEnter={() => setHoveredTab(link.path)}
                                onMouseLeave={() => setHoveredTab(null)}
                                className={cn(
                                    "relative",
                                    isLogout ? "ml-8" : ""
                                )}
                            >
                                {link.action ? (
                                    <button
                                        onClick={link.action}
                                        className={cn(
                                            "relative z-10 px-6 py-3 text-base font-medium transition-colors duration-200 block whitespace-nowrap",
                                            isActive ? "text-zubr-dark" : "text-gray-200",
                                            isHovered && !isActive && isLogout ? "text-black" : "",
                                            isHovered && !isActive && !isLogout ? "text-white" : ""
                                        )}
                                    >
                                        {link.name}
                                    </button>
                                ) : (
                                    <Link
                                        to={link.path}
                                        className={cn(
                                            "relative z-10 px-6 py-3 text-base font-medium transition-colors duration-200 block whitespace-nowrap",
                                            isActive ? "text-zubr-dark" : "text-gray-200",
                                            isHovered && !isActive ? "text-white" : ""
                                        )}
                                    >
                                        {link.name}
                                        {link.name === "Portfel" && unreadAlerts > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                                {unreadAlerts}
                                            </span>
                                        )}
                                    </Link>
                                )}

                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute inset-0 bg-zubr-gold rounded-xl z-0"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}

                                    {isHovered && !isActive && (
                                        <motion.div
                                            className={cn(
                                                "absolute inset-0 rounded-xl z-0",
                                                isLogout ? "bg-red-500" : "bg-white/10"
                                            )}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MOBILE NAVBAR */}
            <div className="fixed top-0 inset-x-0 z-50 lg:hidden">
                <div className="flex items-center justify-between p-4 bg-zubr-dark/95 backdrop-blur-md border-b border-white/10 shadow-xl">
                    <Link to="/" className="flex items-center">
                        <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
                    </Link>

                    <div className="flex items-center gap-3">
                        {isAuthenticated && unreadAlerts > 0 && (
                            <Link to="/wallet" className="relative text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {unreadAlerts}
                                </span>
                            </Link>
                        )}

                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="text-white p-2"
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-zubr-dark/95 backdrop-blur-md border-b border-white/10 shadow-xl"
                        >
                            <div className="flex flex-col p-4 gap-1">
                                {links.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    const isLogout = link.name === "Wyloguj";

                                    return link.action ? (
                                        <button
                                            key={link.path}
                                            onClick={() => {
                                                link.action();
                                                setMobileOpen(false);
                                            }}
                                            className={cn(
                                                "px-4 py-3 text-left font-medium rounded-lg transition-colors",
                                                isLogout ? "text-red-400 hover:bg-red-500/20 mt-4" : "text-gray-200 hover:bg-white/10"
                                            )}
                                        >
                                            {link.name}
                                        </button>
                                    ) : (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                                "px-4 py-3 font-medium rounded-lg transition-colors",
                                                isActive ? "bg-zubr-gold text-zubr-dark" : "text-gray-200 hover:bg-white/10"
                                            )}
                                        >
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

export default Navbar;