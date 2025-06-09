import React from 'react';
import { useTranslation } from 'react-i18next';

function Footer() {
    const { t } = useTranslation();

    return (
        <footer style={{ backgroundColor: '#f8f9fa', padding: '1rem', marginTop: '2rem', textAlign: 'center' }}>
            <p>&copy; {new Date().getFullYear()} {t('appName', 'Recipe App')} - {t('footerText', 'Wszystkie prawa zastrzeżone')}</p>
        </footer>
    );
}

export default Footer;