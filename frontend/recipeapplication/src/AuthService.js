// AuthService.js - Klasa pomocnicza do zarządzania tokenami JWT
class AuthService {
    static getToken() {
        return localStorage.getItem('token');
    }

    static getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // Bezpieczne dekodowanie base64url (format używany w JWT)
    static base64UrlDecode(base64Url) {
        if (!base64Url) return null;

        try {
            // Zamień znaki specjalne base64url na standardowe znaki base64
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

            // Dodaj odpowiednią ilość znaków '=' na końcu
            const padding = '='.repeat((4 - base64.length % 4) % 4);

            // Dekoduj
            return atob(base64 + padding);
        } catch (e) {
            // Jeśli standardowe dekodowanie nie zadziała, zwróć null
            return null;
        }
    }

    static isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Sprawdź, czy to może być token prostego formatu (niepodzielony kropkami)
        if (!token.includes('.')) {
            return true; // Zakładamy, że token w innym formacie jest ważny
        }

        try {
            // Sprawdź czy token zawiera poprawne części
            const parts = token.split('.');

            if (parts.length !== 3) {
                return false;
            }

            const payloadStr = this.base64UrlDecode(parts[1]);
            if (!payloadStr) return false;

            try {
                const payload = JSON.parse(payloadStr);

                // Sprawdzenie czy token nie wygasł
                if (payload.exp) {
                    return payload.exp * 1000 > Date.now();
                } else {
                    return true;
                }
            } catch (jsonError) {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('tokenChange'));
    }

    static getPayload() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }

            const payloadStr = this.base64UrlDecode(parts[1]);
            if (!payloadStr) return null;

            try {
                return JSON.parse(payloadStr);
            } catch (e) {
                return null;
            }
        } catch (e) {
            return null;
        }
    }

    static getUserEmail() {
        const payload = this.getPayload();
        return payload ? payload.sub : null;
    }
}

export default AuthService;
