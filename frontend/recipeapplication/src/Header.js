import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

function Header() {
    const { t, i18n } = useTranslation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Sprawdzanie stanu logowania (jako useCallback, aby można było go używać w innych funkcjach)
    const checkLogin = useCallback(() => {
        const hasToken = !!localStorage.getItem('token');
        console.log('[Header] Sprawdzanie stanu logowania:', hasToken ? 'zalogowany' : 'niezalogowany');
        setIsLoggedIn(hasToken);
    }, []);

    // Sprawdzaj stan logowania przy każdej zmianie ścieżki
    useEffect(() => {
        checkLogin();
    }, [location.pathname, checkLogin]);

    // Nasłuchuj zdarzeń dotyczących zmiany tokenu
    useEffect(() => {
        console.log('[Header] Dodawanie nasłuchiwania zdarzeń');

        // Nasłuchuj zmiany w localStorage (dla wielu kart)
        window.addEventListener('storage', checkLogin);

        // Nasłuchuj dedykowanego zdarzenia dla zmian tokenu
        const onTokenChange = () => {
            console.log('[Header] Wykryto zdarzenie tokenChange');
            checkLogin();
        };
        window.addEventListener('tokenChange', onTokenChange);

        return () => {
            window.removeEventListener('storage', checkLogin);
            window.removeEventListener('tokenChange', onTokenChange);
        };
    }, [checkLogin]);

    // Funkcja wylogowania
    const handleLogout = () => {
        console.log('[Header] Rozpoczęcie procesu wylogowania');

        // Usuwamy tokeny
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');

        // Emitujemy zdarzenie zmiany tokenu
        console.log('[Header] Emitowanie zdarzenia tokenChange');
        window.dispatchEvent(new Event('tokenChange'));

        // Przekierowanie na stronę główną
        navigate('/', { replace: true });

        console.log('[Header] Wylogowano użytkownika');
    };

    return (
        <header className="bg-light shadow-sm mb-4">
            <nav className="navbar navbar-expand-lg navbar-light container">
                <div className="container-fluid">
                    <Link to="/" className="navbar-brand fw-bold">
                        {t('appName', 'Recipe App')}
                    </Link>
                    <div className="d-flex align-items-center">
                        <div className="btn-group me-3">
                            <button
                                onClick={() => i18n.changeLanguage('pl')}
                                className={`btn btn-sm ${i18n.language === 'pl' ? 'btn-secondary' : 'btn-outline-secondary'}`}>
                                PL
                            </button>
                            <button
                                onClick={() => i18n.changeLanguage('en')}
                                className={`btn btn-sm ${i18n.language === 'en' ? 'btn-secondary' : 'btn-outline-secondary'}`}>
                                EN
                            </button>
                        </div>
                        {isLoggedIn ? (
                            <div className="d-flex align-items-center">
                                <Link to="/profile" className="text-decoration-none text-dark fs-5 me-3" title={t('profile', 'Profil')}>
                                    <span role="img" aria-label="profile">👤</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-outline-danger btn-sm"
                                >
                                    {t('logout', 'Wyloguj')}
                                </button>
                            </div>
                        ) : (
                            <div className="nav-item">
                                <Link to="/login" className="btn btn-outline-success me-2">
                                    {t('login', 'Logowanie')}
                                </Link>
                                <Link to="/register" className="btn btn-success">
                                    {t('register', 'Rejestracja')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;

