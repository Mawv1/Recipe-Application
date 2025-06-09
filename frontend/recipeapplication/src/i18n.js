import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    pl: {
        translation: {
            appName: 'Aplikacja Przepisów',
            searchPlaceholder: 'Wyszukaj przepis...',
            searchButton: 'Szukaj',
            recipesList: 'Lista przepisów',
            noRecipes: 'Brak przepisów do wyświetlenia',
            author: 'Autor',
            rate: 'Ocena',
            estimatedTime: 'Czas przygotowania',
            login: 'Logowanie',
            register: 'Rejestracja',
            footerText: 'Wszystkie prawa zastrzeżone'
        }
    },
    en: {
        translation: {
            appName: 'Recipe App',
            searchPlaceholder: 'Search for a recipe...',
            searchButton: 'Search',
            recipesList: 'Recipes List',
            noRecipes: 'No recipes to display',
            author: 'Author',
            rate: 'Rating',
            estimatedTime: 'Prep time',
            login: 'Login',
            register: 'Register',
            footerText: 'All rights reserved'
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'pl',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
