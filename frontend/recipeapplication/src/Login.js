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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Sprawdzenie odpowiedzi z serwera
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = t('invalidEmailOrPassword');

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
          console.log("Błąd parsowania JSON:", e, "Tekst odpowiedzi:", errorText);
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
        throw new Error(t('noAuthToken'));
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
    }
  };

  return (
    <Container className="my-4">
      <Row className="justify-content-center">
        <Col sm={12} md={8} lg={6} className="card-container">
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">{t('login')}</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="mb-3"
                  />
                </Form.Group>
                <Form.Group controlId="formPassword">
                  <Form.Label>{t('password')}</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder={t('password')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="mb-4"
                  />
                </Form.Group>
                <Button variant="warning" type="submit" className="w-100 py-2">
                  {t('login')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;

