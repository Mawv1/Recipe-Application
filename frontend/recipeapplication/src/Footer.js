import React from 'react';
import { useTranslation } from 'react-i18next';

function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-light py-3 mt-auto text-center border-top">
            <div className="container">
                <p className="mb-0">&copy; {new Date().getFullYear()} {t('appName', 'Recipe App')} - {t('footerText', 'Wszystkie prawa zastrzeżone')}</p>
            </div>
        </footer>
    );
}

export default Footer;

