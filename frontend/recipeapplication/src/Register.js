import React, { useState, useEffect } from 'react';
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

  // Stany do walidacji
  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [validated, setValidated] = useState(false);
  const [formTouched, setFormTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false
  });

  // Walidacja hasła przy każdej zmianie
  useEffect(() => {
    if (password) {
      const strength = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      setPasswordStrength(strength);

      if (formTouched.password) {
        validatePassword();
      }
    }
  }, [password]);

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

    const allRequirementsMet =
      passwordStrength.length &&
      passwordStrength.uppercase &&
      passwordStrength.number &&
      passwordStrength.special;

    if (!allRequirementsMet) {
      return setFormErrors(prev => ({
        ...prev,
        password: t('invalidPassword', 'Hasło nie spełnia wymagań bezpieczeństwa')
      }));
    }

    setFormErrors(prev => ({ ...prev, password: null }));
    return true;
  };

  const validateName = (name, field) => {
    if (!name || name.trim() === '') {
      return setFormErrors(prev => ({
        ...prev,
        [field]: t(`${field}Required`, field === 'firstName' ? 'Imię jest wymagane' : 'Nazwisko jest wymagane')
      }));
    }
    if (name.length < 2) {
      return setFormErrors(prev => ({
        ...prev,
        [field]: t(`${field}TooShort`, field === 'firstName' ? 'Imię jest za krótkie' : 'Nazwisko jest za krótkie')
      }));
    }
    setFormErrors(prev => ({ ...prev, [field]: null }));
    return true;
  };

  const validateForm = () => {
    const isFirstNameValid = validateName(firstName, 'firstName');
    const isLastNameValid = validateName(lastName, 'lastName');
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    return isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid;
  };

  // Obsługa zmiany pól formularza
  const handleFieldChange = (field, value) => {
    // Oznacz pole jako dotknięte (touched)
    setFormTouched(prev => ({ ...prev, [field]: true }));

    // Aktualizuj wartość pola
    switch (field) {
      case 'firstName':
        setFirstName(value);
        validateName(value, field);
        break;
      case 'lastName':
        setLastName(value);
        validateName(value, field);
        break;
      case 'email':
        setEmail(value);
        validateEmail();
        break;
      case 'password':
        setPassword(value);
        // Walidacja hasła jest wykonywana w useEffect
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Oznacz wszystkie pola jako dotknięte
    setFormTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true
    });

    const isValid = validateForm();
    setValidated(true);

    if (!isValid) {
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });

      if (!res.ok) {
        // Próba pobrania szczegółowego komunikatu błędu z serwera
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Rejestracja nie powiodła się');
        } catch (jsonError) {
          throw new Error('Rejestracja nie powiodła się');
        }
      }

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

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group controlId="formFirstName">
                  <Form.Label>{t('firstName', 'Imię')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('firstName', 'Imię')}
                    value={firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    isInvalid={formTouched.firstName && !!formErrors.firstName}
                    required
                    className="mb-0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.firstName}
                  </Form.Control.Feedback>
                  <div className="mb-3"></div>
                </Form.Group>

                <Form.Group controlId="formLastName">
                  <Form.Label>{t('lastName', 'Nazwisko')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('lastName', 'Nazwisko')}
                    value={lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    isInvalid={formTouched.lastName && !!formErrors.lastName}
                    required
                    className="mb-0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.lastName}
                  </Form.Control.Feedback>
                  <div className="mb-3"></div>
                </Form.Group>

                <Form.Group controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    isInvalid={formTouched.email && !!formErrors.email}
                    required
                    className="mb-0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                  <div className="mb-3"></div>
                </Form.Group>

                <Form.Group controlId="formPassword">
                  <Form.Label>{t('password', 'Hasło')}</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder={t('password', 'Hasło')}
                    value={password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    isInvalid={formTouched.password && !!formErrors.password}
                    required
                    className="mb-0"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>

                  {/* Wskaźniki siły hasła */}
                  <div className="password-strength-meter mt-2 mb-3">
                    <p className="text-muted small mb-1">{t('passwordRequirements', 'Hasło musi spełniać następujące wymagania:')}</p>
                    <ul className="list-unstyled small">
                      <li className={passwordStrength.length ? 'text-success' : 'text-danger'}>
                        <i className={`fas fa-${passwordStrength.length ? 'check' : 'times'} me-1`}></i>
                        {t('passwordLength', 'Conajmniej 8 znaków')}
                      </li>
                      <li className={passwordStrength.uppercase ? 'text-success' : 'text-danger'}>
                        <i className={`fas fa-${passwordStrength.uppercase ? 'check' : 'times'} me-1`}></i>
                        {t('passwordUppercase', 'Conajmniej 1 duża litera')}
                      </li>
                      <li className={passwordStrength.number ? 'text-success' : 'text-danger'}>
                        <i className={`fas fa-${passwordStrength.number ? 'check' : 'times'} me-1`}></i>
                        {t('passwordNumber', 'Conajmniej 1 cyfra')}
                      </li>
                      <li className={passwordStrength.special ? 'text-success' : 'text-danger'}>
                        <i className={`fas fa-${passwordStrength.special ? 'check' : 'times'} me-1`}></i>
                        {t('passwordSpecial', 'Conajmniej 1 znak specjalny (!@#$%^&*)')}
                      </li>
                    </ul>
                  </div>
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

