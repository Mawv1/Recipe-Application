import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Header() {
    const { t, i18n } = useTranslation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkLogin = () => setIsLoggedIn(!!localStorage.getItem('token'));
        checkLogin();
        window.addEventListener('storage', checkLogin);
        // Odśwież stan po logowaniu/wylogowaniu w tym oknie
        const onTokenChange = () => checkLogin();
        window.addEventListener('tokenChange', onTokenChange);
        return () => {
            window.removeEventListener('storage', checkLogin);
            window.removeEventListener('tokenChange', onTokenChange);
        };
    }, []);

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
                            <Link to="/profile" className="text-decoration-none text-dark fs-5 ms-2" title={t('profile', 'Profil')}>
                                <span role="img" aria-label="profile">👤</span>
                            </Link>
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

