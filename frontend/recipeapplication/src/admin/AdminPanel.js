// src/admin/AdminPanel.js
import React from 'react';
import { Container, Row, Col, Nav, Card, Alert } from 'react-bootstrap';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Zakładam, że istnieje taki kontekst

function AdminPanel() {
    const { currentUser, isAuthenticated } = useAuth();
    const location = useLocation();

    // Przekierowanie jeśli użytkownik nie jest zalogowany
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Sprawdzenie czy użytkownik ma uprawnienia administratora
    if (currentUser?.role !== 'ADMIN') {
        return (
            <Container className="py-5">
                <Card className="text-center p-5">
                    <h3>Brak dostępu</h3>
                    <p>Nie masz uprawnień do wyświetlenia panelu administracyjnego.</p>
                    <Link to="/" className="btn btn-primary">Wróć na stronę główną</Link>
                </Card>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <h1 className="mb-4">Panel Administratora</h1>
            <Row>
                <Col md={3}>
                    <Nav variant="pills" className="flex-column">
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/pending-recipes"
                                      active={location.pathname === '/admin/pending-recipes'}>
                                Oczekujące przepisy
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/users"
                                      active={location.pathname === '/admin/users'}>
                                Zarządzanie użytkownikami
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/categories"
                                      active={location.pathname === '/admin/categories'}>
                                Zarządzanie kategoriami
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Col>
                <Col md={9}>
                    <Card className="p-3">
                        <Outlet /> {/* Tu będą wyświetlane podkomponenty */}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default AdminPanel;