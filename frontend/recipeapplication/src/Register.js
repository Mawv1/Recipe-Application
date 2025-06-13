import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import './Auth.css';

function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });
      if (!res.ok) throw new Error('Rejestracja nie powiodła się');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
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
              <h2 className="text-center mb-4">{t('register')}</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{t('registrationSuccess', 'Rejestracja zakończona pomyślnie! Przekierowanie do strony logowania...')}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formFirstName">
                  <Form.Label>{t('firstName', 'Imię')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('firstName', 'Imię')}
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    className="mb-3"
                  />
                </Form.Group>
                <Form.Group controlId="formLastName">
                  <Form.Label>{t('lastName', 'Nazwisko')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('lastName', 'Nazwisko')}
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    className="mb-3"
                  />
                </Form.Group>
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
                  <Form.Label>{t('password', 'Hasło')}</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder={t('password', 'Hasło')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="mb-4"
                  />
                </Form.Group>
                <Button variant="warning" type="submit" className="w-100 py-2">
                  {t('register', 'Zarejestruj się')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;

