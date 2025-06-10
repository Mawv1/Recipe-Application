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
        <header style={{ backgroundColor: '#f8f9fa', padding: '1rem', marginBottom: '2rem' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {t('appName', 'Recipe App')}
                    </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="lang-switcher">
                        <button onClick={() => i18n.changeLanguage('pl')} style={{ fontWeight: i18n.language === 'pl' ? 'bold' : 'normal' }}>PL</button>
                        <button onClick={() => i18n.changeLanguage('en')} style={{ fontWeight: i18n.language === 'en' ? 'bold' : 'normal' }}>EN</button>
                    </div>
                    {isLoggedIn ? (
                        <Link to="/profile" style={{ textDecoration: 'none', color: '#333', fontSize: '1.7rem', marginLeft: '1rem' }} title={t('profile', 'Profil')}>
                            <span role="img" aria-label="profile">👤</span> {t('profile', 'Profil')}
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" style={{ marginRight: '1rem', textDecoration: 'none', color: '#333' }}>
                                {t('login', 'Logowanie')}
                            </Link>
                            <Link to="/register" style={{ textDecoration: 'none', color: '#333' }}>
                                {t('register', 'Rejestracja')}
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Header;

