import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Badge, Alert, Spinner } from 'react-bootstrap';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBanModal, setShowBanModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // Pobieranie listy użytkowników
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/api/v1/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                if (!response.ok) {
                    throw new Error(`Błąd HTTP: ${response.status}`);
                }

                const data = await response.json();
                setUsers(data);
            } catch (err) {
                console.error("Błąd podczas pobierania użytkowników:", err);
                setError('Nie udało się pobrać listy użytkowników. ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Funkcja do banowania użytkownika
    const handleBanUser = async () => {
        if (!selectedUser) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/v1/admin/users/${selectedUser.id}/ban?reason=${encodeURIComponent(banReason)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }

            const updatedUser = await response.json();
            
            // Aktualizacja stanu użytkowników
            setUsers(users.map(user => 
                user.id === updatedUser.id ? updatedUser : user
            ));
            
            setActionSuccess(`Użytkownik ${selectedUser.firstName} ${selectedUser.lastName} został zbanowany.`);
            setShowBanModal(false);
            setBanReason('');
        } catch (err) {
            console.error("Błąd podczas banowania użytkownika:", err);
            setError('Nie udało się zbanować użytkownika. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Funkcja do odbanowania użytkownika
    const handleUnbanUser = async (user) => {
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/v1/admin/users/${user.id}/unban`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }

            const updatedUser = await response.json();
            
            // Aktualizacja stanu użytkowników
            setUsers(users.map(u => 
                u.id === updatedUser.id ? updatedUser : u
            ));
            
            setActionSuccess(`Użytkownik ${user.firstName} ${user.lastName} został odbanowany.`);
        } catch (err) {
            console.error("Błąd podczas odbanowania użytkownika:", err);
            setError('Nie udało się odbanować użytkownika. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Otwieranie modalu do banowania
    const openBanModal = (user) => {
        setSelectedUser(user);
        setShowBanModal(true);
    };

    // Czyszczenie komunikatu sukcesu po 3 sekundach
    useEffect(() => {
        if (actionSuccess) {
            const timer = setTimeout(() => setActionSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [actionSuccess]);

    if (loading && users.length === 0) {
        return <div className="text-center p-5"><Spinner animation="border" /></div>;
    }

    return (
        <div>
            <h2 className="mb-4">Zarządzanie Użytkownikami</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Imię</th>
                        <th>Nazwisko</th>
                        <th>Email</th>
                        <th>Rola</th>
                        <th>Status</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.firstName}</td>
                            <td>{user.lastName}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>
                                {user.banned ? 
                                    <Badge bg="danger">Zbanowany</Badge> : 
                                    <Badge bg="success">Aktywny</Badge>
                                }
                            </td>
                            <td>
                                {user.banned ? (
                                    <Button 
                                        variant="outline-success" 
                                        size="sm"
                                        onClick={() => handleUnbanUser(user)}
                                        disabled={loading}
                                    >
                                        Odbanuj
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={() => openBanModal(user)}
                                        disabled={loading}
                                    >
                                        Zbanuj
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Modal do banowania użytkownika */}
            <Modal show={showBanModal} onHide={() => setShowBanModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Banowanie użytkownika</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <>
                            <p>Czy na pewno chcesz zbanować użytkownika <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>?</p>
                            <Form.Group>
                                <Form.Label>Powód bana (opcjonalnie)</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={3} 
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBanModal(false)}>
                        Anuluj
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleBanUser}
                        disabled={loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : 'Zbanuj'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Users;
