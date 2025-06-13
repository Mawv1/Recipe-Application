import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    pl: {
        translation: {
            appName: 'Recipix',
            searchPlaceholder: 'Wyszukaj przepis...',
            searchButton: 'Szukaj',
            recipesList: 'Lista przepisów',
            noRecipes: 'Brak przepisów do wyświetlenia',
            author: 'Autor',
            rate: 'Ocena',
            estimatedTime: 'Czas przygotowania',
            login: 'Logowanie',
            register: 'Rejestracja',
            footerText: 'Wszystkie prawa zastrzeżone',
            password: "Hasło",

            // Profile page
            profile: 'Profil użytkownika',
            personalInfo: 'Dane osobowe',
            edit: 'Edytuj',
            firstName: 'Imię',
            lastName: 'Nazwisko',
            email: 'Email',
            changePassword: 'Zmień hasło',
            cancel: 'Anuluj',
            save: 'Zapisz',
            currentPassword: 'Obecne hasło',
            newPassword: 'Nowe hasło',
            confirmPassword: 'Potwierdź hasło',
            logout: 'Wyloguj się',
            refreshRecipes: 'Odśwież przepisy',
            loading: 'Ładowanie profilu...',
            backToLogin: 'Wróć do logowania',
            profileNotAvailable: 'Profil niedostępny. Zaloguj się, aby kontynuować.',
            profileUpdated: 'Profil został zaktualizowany pomyślnie!',
            profileUpdateError: 'Wystąpił błąd podczas aktualizacji profilu.',
            passwordsDoNotMatch: 'Nowe hasło i potwierdzenie hasła nie są identyczne!',
            unauthorized: 'Brak uprawnień do zmiany hasła. Upewnij się, że jesteś zalogowany.',
            incorrectCurrentPassword: 'Obecne hasło jest niepoprawne!',
            passwordChangeError: 'Błąd podczas zmiany hasła',
            passwordChanged: 'Hasło zostało zmienione pomyślnie!',

            // Login and registration errors
            invalidEmailOrPassword: 'Błędny email lub hasło',
            noAuthToken: 'Serwer nie zwrócił tokena uwierzytelniającego',
            registrationSuccess: 'Rejestracja zakończona pomyślnie! Możesz się teraz zalogować.',
            registrationError: 'Błąd podczas rejestracji',
            emailAlreadyExists: 'Użytkownik o podanym adresie email już istnieje',
            passwordRequirements: 'Hasło musi zawierać przynajmniej 8 znaków, w tym małą i wielką literę, cyfrę oraz znak specjalny',

            // Recipe related
            followRecipe: 'Obserwuj przepis',
            unfollowRecipe: 'Przestań obserwować',
            followedRecipes: 'Obserwowane przepisy',
            noFollowedRecipes: 'Nie obserwujesz żadnych przepisów',
            ingredients: 'Składniki',
            instructions: 'Instrukcje',
            minutes: 'minut',
            viewDetails: 'Zobacz szczegóły'
        }
    },
    en: {
        translation: {
            appName: 'Recipix',
            searchPlaceholder: 'Search for a recipe...',
            searchButton: 'Search',
            recipesList: 'Recipes List',
            noRecipes: 'No recipes to display',
            author: 'Author',
            rate: 'Rating',
            estimatedTime: 'Prep time',
            login: 'Login',
            register: 'Register',
            footerText: 'All rights reserved',
            password: "Password",

            // Profile page
            profile: 'User Profile',
            personalInfo: 'Personal Information',
            edit: 'Edit',
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            changePassword: 'Change Password',
            cancel: 'Cancel',
            save: 'Save',
            currentPassword: 'Current Password',
            newPassword: 'New Password',
            confirmPassword: 'Confirm Password',
            logout: 'Logout',
            refreshRecipes: 'Refresh Recipes',
            loading: 'Loading profile...',
            backToLogin: 'Back to Login',
            profileNotAvailable: 'Profile not available. Please login to continue.',
            profileUpdated: 'Profile has been successfully updated!',
            profileUpdateError: 'An error occurred while updating the profile.',
            passwordsDoNotMatch: 'New password and confirmation password do not match!',
            unauthorized: 'No permission to change password. Make sure you are logged in.',
            incorrectCurrentPassword: 'Current password is incorrect!',
            passwordChangeError: 'Error changing password',
            passwordChanged: 'Password has been changed successfully!',

            // Login and registration errors
            invalidEmailOrPassword: 'Invalid email or password',
            noAuthToken: 'Server did not return authentication token',
            registrationSuccess: 'Registration completed successfully! You can now log in.',
            registrationError: 'Registration error',
            emailAlreadyExists: 'User with this email already exists',
            passwordRequirements: 'Password must be at least 8 characters long and contain lowercase, uppercase, digit and special character',

            // Recipe related
            followRecipe: 'Follow Recipe',
            unfollowRecipe: 'Unfollow',
            followedRecipes: 'Followed Recipes',
            noFollowedRecipes: 'You are not following any recipes',
            ingredients: 'Ingredients',
            instructions: 'Instructions',
            minutes: 'minutes',
            viewDetails: 'View Details'
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
