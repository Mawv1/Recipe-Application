import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Alert, Spinner, Card, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

function Categories() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Pobieranie listy kategorii
    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/v1/categories', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(t('fetchCategoriesError'));
            }

            const data = await response.json();
            // Weryfikacja struktury odpowiedzi
            const categoriesData = Array.isArray(data) ? data :
                                (data.content && Array.isArray(data.content)) ? data.content : [];

            setCategories(categoriesData);
        } catch (err) {
            console.error("Błąd podczas pobierania kategorii:", err);
            setError(t('fetchCategoriesError'));
        } finally {
            setLoading(false);
        }
    };

    // Pobierz kategorie przy pierwszym renderowaniu
    useEffect(() => {
        fetchCategories();
    }, []);

    // Dodawanie nowej kategorii
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            setError(t('emptyCategoryError'));
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/v1/categories', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newCategoryName })
            });

            if (!response.ok) {
                throw new Error(t('categoryAddError'));
            }

            // Pobierz zaktualizowaną listę kategorii
            await fetchCategories();
            setSuccess(t('categoryAdded'));
            setNewCategoryName(''); // Wyczyść pole formularza

            // Automatycznie ukryj komunikat sukcesu po 3 sekundach
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Błąd podczas dodawania kategorii:", err);
            setError(t('categoryAddError'));
        } finally {
            setLoading(false);
        }
    };

    // Otwieranie modalu potwierdzenia usunięcia
    const openDeleteModal = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    // Usuwanie kategorii
    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/v1/categories/${categoryToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(t('categoryDeleteError'));
            }

            // Pobierz zaktualizowaną listę kategorii
            await fetchCategories();
            setSuccess(t('categoryDeleted'));
            setShowDeleteModal(false);

            // Automatycznie ukryj komunikat sukcesu po 3 sekundach
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Błąd podczas usuwania kategorii:", err);
            setError(t('categoryDeleteError'));
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <div>
            <h2 className="mb-4">{t('categoryManagement')}</h2>

            {/* Formularz dodawania kategorii */}
            <Card className="mb-4">
                <Card.Body>
                    <h5>{t('addNewCategory')}</h5>
                    <Form onSubmit={handleAddCategory}>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('categoryName')}</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder={t('enterCategoryName')}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={loading || !newCategoryName.trim()}
                        >
                            {loading ? <Spinner size="sm" animation="border" /> : t('addCategory')}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {/* Komunikaty */}
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Lista kategorii */}
            <Card>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">{t('categoryList')}</h5>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={fetchCategories}
                            disabled={loading}
                        >
                            <i className="fas fa-sync-alt me-1"></i> {t('refreshCategories')}
                        </Button>
                    </div>

                    {loading && categories.length === 0 ? (
                        <div className="text-center p-3">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>{t('categoryId')}</th>
                                    <th>{t('categoryName')}</th>
                                    <th>{t('categoryActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length > 0 ? (
                                    categories.map(category => (
                                        <tr key={category.id}>
                                            <td>{category.id}</td>
                                            <td>{category.name}</td>
                                            <td>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => openDeleteModal(category)}
                                                >
                                                    {t('deleteCategory')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center">{t('noCategories')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Modal potwierdzenia usunięcia */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{t('confirmDeleteCategory')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {categoryToDelete && (
                        <p>
                            {t('confirmDeleteCategoryText')} <strong>{categoryToDelete.name}</strong>?
                            <br />
                            <span className="text-danger">{t('categoryDeleteWarning')}</span>
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDeleteCategory}
                        disabled={loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : t('deleteCategory')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Categories;
