import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function Header() {
    const { t } = useTranslation();

    return (
        <header style={{ backgroundColor: '#f8f9fa', padding: '1rem', marginBottom: '2rem' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {t('appName', 'Recipe App')}
                    </Link>
                </div>
                <div>
                    <Link to="/login" style={{ marginRight: '1rem', textDecoration: 'none', color: '#333' }}>
                        {t('login', 'Logowanie')}
                    </Link>
                    <Link to="/register" style={{ textDecoration: 'none', color: '#333' }}>
                        {t('register', 'Rejestracja')}
                    </Link>
                </div>
            </nav>
        </header>
    );
}

export default Header;