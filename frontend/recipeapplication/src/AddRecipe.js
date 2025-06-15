import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Recipe.css';

function AddRecipe() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Formularz przepisu
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [estimatedTimeToPrepare, setEstimatedTimeToPrepare] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', amount: '', unit: '' }]);
  const [tagsInput, setTagsInput] = useState('');

  // Ref do ReactQuill
  const quillRef = React.useRef();

  // Konfiguracja ReactQuill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'image'
  ];

  // Customowy handler do uploadu obrazków w ReactQuill
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;

      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8080/api/v1/uploads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Błąd uploadu zdjęcia');
        }

        const fileUrl = await response.text();

        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        editor.insertEmbed(range.index, 'image', fileUrl);
      } catch (err) {
        console.error("Błąd podczas przesyłania obrazu:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  };

  // Sprawdzenie, czy użytkownik jest zalogowany
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('[AddRecipe] Token z localStorage:', token);
    if (!token) {
      navigate('/login');
    } else {
      setIsAuthenticated(true);
      // Pobieranie kategorii
      fetchCategories(token);
    }
  }, [navigate]);

  // Po zamontowaniu komponentu, dodaj handler do przycisku obrazu
  useEffect(() => {
    if (quillRef.current) {
      const toolbar = quillRef.current.getEditor().getModule('toolbar');
      toolbar.addHandler('image', imageHandler);
    }
  }, []);

  // Pobieranie kategorii przepisów
  const fetchCategories = async (token) => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(t('fetchCategoriesError', 'Nie udało się pobrać kategorii'));
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Błąd podczas pobierania kategorii:', err);
      setError(err.message);
    }
  };

  // Dodawanie nowego pola składnika
  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  // Usuwanie pola składnika
  const removeIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  // Aktualizacja pola składnika
  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  // Obsługa uploadu zdjęcia głównego
  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://localhost:8080/api/v1/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!response.ok) {
        throw new Error('Błąd uploadu zdjęcia');
      }
      const fileUrl = await response.text();
      setMainImageUrl(fileUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Obsługa zmiany zawartości edytora
  const handleEditorChange = (content) => {
    setDescription(content);
  };

  // Obsługa wysyłania formularza
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Walidacja formularza
    if (!title || !description || !categoryId || ingredients.some(ing => !ing.name || !ing.amount)) {
      setError(t('formValidationError', 'Proszę wypełnić wszystkie wymagane pola'));
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');

    try {
      // Przygotowanie danych do wysłania
      const recipeData = {
        title,
        description,
        categoryId: parseInt(categoryId),
        estimatedTimeToPrepare,
        mainImageUrl,
        ingredients: ingredients.filter(ing => ing.name && ing.amount),
        tags: tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      // Wysłanie żądania do API
      const response = await fetch('http://localhost:8080/api/v1/recipes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recipeData)
      });

      if (!response.ok) {
        throw new Error(t('addRecipeError', 'Nie udało się dodać przepisu'));
      }

      const data = await response.json();
      console.log('Dodano nowy przepis:', data);

      // Wyświetlenie komunikatu o sukcesie i przekierowanie
      setSuccess(true);
      setTimeout(() => {
        navigate(`/recipes/${data.id}`);
      }, 2000);

    } catch (err) {
      console.error('Błąd podczas dodawania przepisu:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Zostanie przekierowany do strony logowania
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="mb-4 text-center">{t('addRecipe', 'Dodaj nowy przepis')}</h2>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{t('recipeAddedSuccess', 'Przepis został pomyślnie dodany!')}</Alert>}

              <Form onSubmit={handleSubmit}>
                {/* Tytuł przepisu */}
                <Form.Group className="mb-3">
                  <Form.Label>{t('recipeTitle', 'Tytuł przepisu')} *</Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                  />
                </Form.Group>

                {/* Opis przepisu jako edytor tekstowy */}
                <Form.Group className="mb-3">
                  <Form.Label>{t('recipeDescription', 'Opis przepisu')} *</Form.Label>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    modules={modules}
                    formats={formats}
                    style={{ height: '300px', marginBottom: '50px' }}
                  />
                  <div style={{ height: '50px' }}></div>
                </Form.Group>

                {/* Kategoria przepisu */}
                <Form.Group className="mb-3">
                  <Form.Label>{t('recipeCategory', 'Kategoria')} *</Form.Label>
                  <Form.Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    <option value="">{t('selectCategory', 'Wybierz kategorię...')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Czas przygotowania */}
                <Form.Group className="mb-3">
                  <Form.Label>{t('estimatedTimeToPrepare', 'Szacowany czas przygotowania')} *</Form.Label>
                  <Form.Control
                    type="text"
                    value={estimatedTimeToPrepare}
                    onChange={(e) => setEstimatedTimeToPrepare(e.target.value)}
                    placeholder={t('timeFormatPlaceholder', 'np. 30 minut')}
                    required
                  />
                </Form.Group>

                {/* Upload zdjęcia głównego */}
                <Form.Group className="mb-3">
                  <Form.Label>{t('mainImageUpload', 'Zdjęcie główne')}</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                  />
                  {mainImageUrl && (
                    <div className="mt-2">
                      <img src={mainImageUrl} alt="Podgląd zdjęcia" style={{maxWidth: '100%', maxHeight: 200}} />
                    </div>
                  )}
                </Form.Group>

                {/* Składniki */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0">{t('ingredients', 'Składniki')} *</Form.Label>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={addIngredient}
                      type="button"
                    >
                      <i className="fas fa-plus me-1"></i> {t('addIngredient', 'Dodaj składnik')}
                    </Button>
                  </div>

                  {ingredients.map((ing, index) => (
                    <div key={index} className="ingredient-row mb-2">
                      <Row>
                        <Col xs={5}>
                          <Form.Control
                            placeholder={t('ingredientName', 'Nazwa składnika')}
                            value={ing.name}
                            onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                            required
                          />
                        </Col>
                        <Col xs={3}>
                          <Form.Control
                            placeholder={t('amount', 'Ilość')}
                            value={ing.amount}
                            onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                            required
                          />
                        </Col>
                        <Col xs={3}>
                          <Form.Control
                            placeholder={t('unit', 'Jednostka')}
                            value={ing.unit}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            required
                          />
                        </Col>
                        <Col xs={1} className="d-flex align-items-center">
                          {index > 0 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeIngredient(index)}
                              type="button"
                              className="p-1"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>

                {/* Tagowanie */}
                <Form.Group className="mb-3">
                  <Form.Label>Tagi (oddzielone przecinkami)</Form.Label>
                  <Form.Control
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="np. szybkie, wegetariańskie, śniadanie"
                  />
                </Form.Group>

                {/* Przyciski */}
                <div className="mt-4 d-flex justify-content-between">
                  <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left me-1"></i> {t('cancel', 'Anuluj')}
                  </Button>
                  <Button variant="warning" type="submit" disabled={loading}>
                    {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                    <i className="fas fa-save me-1"></i> {t('saveRecipe', 'Zapisz przepis')}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AddRecipe;
