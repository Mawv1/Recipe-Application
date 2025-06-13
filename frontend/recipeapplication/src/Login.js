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

      if (!res.ok) throw new Error(t('invalidEmailOrPassword'));

      const data = await res.json();

      if (!data.access_token) {
        throw new Error(t('noAuthToken'));
      }

      // Wyczyść wszelkie istniejące tokeny przed ustawieniem nowego
      localStorage.removeItem('token');

      // Zapisz token w localStorage
      localStorage.setItem('token', data.access_token);

      // Zapisz te�� refresh token jeśli istnieje
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

