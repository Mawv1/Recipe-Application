import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

function Users() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBanModal, setShowBanModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // Funkcja pobierania użytkowników - wydzielona na zewnątrz useEffect, aby można było ją wywoływać po akcjach
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
                throw new Error(`${t('fetchUsersError')} ${response.status}`);
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error("Błąd podczas pobierania użytkowników:", err);
            setError(t('fetchUsersError') + ' ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Pobieranie listy użytkowników
    useEffect(() => {
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
                throw new Error(`${t('banningError')} ${response.status}`);
            }

            const updatedUser = await response.json();

            // Odświeżenie listy użytkowników po operacji banowania
            await fetchUsers();

            setActionSuccess(t('userHasBanned', 'Użytkownik {{name}} został zbanowany.', {
                name: `${selectedUser.firstName} ${selectedUser.lastName}`
            }));
            setShowBanModal(false);
            setBanReason('');
        } catch (err) {
            console.error("Błąd podczas banowania użytkownika:", err);
            setError(t('banningError') + ' ' + err.message);
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
                throw new Error(`${t('unbanningError')} ${response.status}`);
            }

            const updatedUser = await response.json();

            // Odświeżenie listy użytkowników po operacji odbanowania
            await fetchUsers();

            setActionSuccess(t('userUnbanned', 'Użytkownik {{name}} został odbanowany.', {
                name: `${user.firstName} ${user.lastName}`
            }));
        } catch (err) {
            console.error("Błąd podczas odbanowania użytkownika:", err);
            setError(t('unbanningError') + ' ' + err.message);
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
            <h2 className="mb-4">{t('userManagement')}</h2>

            <Button
                variant="outline-primary"
                className="mb-3"
                onClick={fetchUsers}
                disabled={loading}
            >
                <i className="fas fa-sync-alt me-1"></i> {t('refreshList')}
            </Button>

            {error && <Alert variant="danger">{error}</Alert>}
            {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>{t('userId')}</th>
                        <th>{t('userFirstName')}</th>
                        <th>{t('userLastName')}</th>
                        <th>{t('userEmail')}</th>
                        <th>{t('userRole')}</th>
                        <th>{t('userStatus')}</th>
                        <th>{t('userActions')}</th>
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
                                    <Badge bg="danger">{t('userBanned')}</Badge> :
                                    <Badge bg="success">{t('userActive')}</Badge>
                                }
                            </td>
                            <td>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="me-1"
                                    onClick={() => console.log("Dane użytkownika:", JSON.stringify(user, null, 2))}
                                >
                                    <i className="fas fa-info-circle"></i> {t('userDetails')}
                                </Button>
                                {user.banned ? (
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => handleUnbanUser(user)}
                                        disabled={loading}
                                    >
                                        {t('unbanUser')}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => openBanModal(user)}
                                        disabled={loading}
                                    >
                                        {t('banUser')}
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
                    <Modal.Title>{t('banningUser')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <>
                            <p>
                                {t('confirmBanUser')} <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>?
                            </p>
                            <Form.Group>
                                <Form.Label>{t('banReason')}</Form.Label>
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
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleBanUser}
                        disabled={loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : t('banUser')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Users;
