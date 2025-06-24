import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import './Auth.css';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Stany do walidacji formularza
  const [formErrors, setFormErrors] = useState({});
  const [validated, setValidated] = useState(false);
  const [formTouched, setFormTouched] = useState({
    email: false,
    password: false
  });

  // Funkcje walidacyjne
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return setFormErrors(prev => ({ ...prev, email: t('emailRequired', 'Email jest wymagany') }));
    }
    if (!emailRegex.test(email)) {
      return setFormErrors(prev => ({ ...prev, email: t('invalidEmail', 'Podaj poprawny adres email') }));
    }
    setFormErrors(prev => ({ ...prev, email: null }));
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      return setFormErrors(prev => ({ ...prev, password: t('passwordRequired', 'Hasło jest wymagane') }));
    }
    setFormErrors(prev => ({ ...prev, password: null }));
    return true;
  };

  const validateForm = () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    return isEmailValid && isPasswordValid;
  };

  // Obsługa zmiany pól formularza
  const handleFieldChange = (field, value) => {
    // Oznacz pole jako dotknięte
    setFormTouched(prev => ({ ...prev, [field]: true }));

    // Aktualizuj wartość pola
    switch (field) {
      case 'email':
        setEmail(value);
        validateEmail();
        break;
      case 'password':
        setPassword(value);
        validatePassword();
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Oznacz wszystkie pola jako dotknięte
    setFormTouched({
      email: true,
      password: true
    });

    const isValid = validateForm();
    setValidated(true);

    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Sprawdzenie odpowiedzi z serwera
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = t('invalidEmailOrPassword', 'Nieprawidłowy email lub hasło');

        // Próbuj parsować odpowiedź jako JSON
        try {
          const errorJson = JSON.parse(errorText);
          console.log("Odpowiedź błędu:", errorJson); // Dodajemy log dla debugowania

          // Sprawdzenie, czy użytkownik jest zbanowany
          if (res.status === 403 || res.status === 401) {
            // Sprawdź czy error zawiera informację o blokadzie konta
            if (errorJson.error && (
                errorJson.error.toLowerCase().includes('zablokowane') ||
                errorJson.error.toLowerCase().includes('konto'))) {
              // Użyj bezpośrednio wiadomości z serwera, która zawiera powód bana
              errorMessage = errorJson.message || t('accountBanned', 'Twoje konto zostało zablokowane.');
            }
            // Sprawdź message pod kątem informacji o blokadzie
            else if (errorJson.message && (
                errorJson.message.toLowerCase().includes('zablokowane') ||
                errorJson.message.toLowerCase().includes('locked') ||
                errorJson.message.toLowerCase().includes('ban') ||
                errorJson.message.toLowerCase().includes('block'))) {
              errorMessage = errorJson.message;
            }
          }

          // Jeśli jest dostępny jakikolwiek komunikat błędu, użyj go
          if (errorJson.message && errorMessage === t('invalidEmailOrPassword')) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          console.log("B��ąd parsowania JSON:", e, "Tekst odpowiedzi:", errorText);
          // Jeśli odpowiedź nie jest w JSON, sprawdź zawartość tekstu
          if (errorText.toLowerCase().includes('locked') ||
              errorText.toLowerCase().includes('ban') ||
              errorText.toLowerCase().includes('block') ||
              errorText.toLowerCase().includes('zablokowa')) {
            errorMessage = t('accountBanned', 'Twoje konto zostało zablokowane.');
          }
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (!data.access_token) {
        throw new Error(t('noAuthToken', 'Nie otrzymano tokenu autoryzacyjnego'));
      }

      // Wyczyść wszelkie istniejące tokeny przed ustawieniem nowego
      localStorage.removeItem('token');

      // Zapisz token w localStorage
      localStorage.setItem('token', data.access_token);

      // Zapisz refresh token jeśli istnieje
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Informuj aplikację o zmianie stanu uwierzytelnienia
      window.dispatchEvent(new Event('tokenChange'));

      // Przekierowanie na stronę główną
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-4">
      <Row className="justify-content-center">
        <Col sm={12} md={8} lg={6} className="card-container">
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">{t('login', 'Zaloguj się')}</h2>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group controlId="formEmail" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    isInvalid={formTouched.email && !!formErrors.email}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="formPassword" className="mb-4">
                  <Form.Label>{t('password', 'Hasło')}</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder={t('password', 'Hasło')}
                    value={password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    isInvalid={formTouched.password && !!formErrors.password}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  variant="warning"
                  type="submit"
                  className="w-100 py-2 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {t('loggingIn', 'Logowanie...')}
                    </>
                  ) : t('login', 'Zaloguj się')}
                </Button>

                {/* Odnośnik do rejestracji */}
                <div className="text-center mt-3">
                  <p className="mb-0">
                    {t('noAccount', 'Nie masz jeszcze konta?')}
                    <a href="/register" className="link-primary ms-2">
                      {t('signupHere', 'Zarejestruj się')}
                    </a>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;

