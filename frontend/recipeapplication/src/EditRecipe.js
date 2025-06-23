import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Recipe.css';
import AuthorizedImage from './components/AuthorizedImage';
import { useAuth } from './contexts/AuthContext';

// Tworzymy komponent opakowujący ReactQuill, który używa forwardRef aby uniknąć ostrzeżenia findDOMNode
const QuillWrapper = forwardRef((props, ref) => {
  return <ReactQuill ref={ref} {...props} />;
});

function EditRecipe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [estimatedTimeToPrepare, setEstimatedTimeToPrepare] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', amount: '', unit: '' }]);
  const [tags, setTags] = useState(['']);
  const [recipeOwnerId, setRecipeOwnerId] = useState(null);

  const quillRef = useRef(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'image', 'align'
  ];

  const resizePastedImages = () => {
    if (!quillRef.current) return;

    const editor = quillRef.current.getEditor();
    editor.root.addEventListener('paste', function(e) {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (!file) continue;

            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.src = event.target.result;

              img.onload = () => {
                const maxWidth = '100%';

                setTimeout(() => {
                  const images = editor.root.querySelectorAll('img');
                  if (images.length > 0) {
                    const latestImage = images[images.length - 1];
                    latestImage.style.maxWidth = maxWidth;
                    latestImage.style.height = 'auto';
                  }
                }, 0);
              };
            };
            reader.readAsDataURL(file);
          }
        }
      }
    });
  };

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];

        const formData = new FormData();
        formData.append('image', file);

        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError(t('addRecipe.imageUploadError'));
            return;
          }

          const response = await fetch('http://localhost:8080/api/v1/images/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();

          const editor = quillRef.current.getEditor();
          const range = editor.getSelection();
          editor.insertEmbed(range.index, 'image', data.url);
        } catch (error) {
          setError(t('addRecipe.imageUploadError'));
        }
      }
    };
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError(t('addRecipe.imageUploadError'));
      setLoading(false);
      return;
    }

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
        const errorText = await response.text().catch(() => 'Brak tekstu błędu');
        throw new Error(`Błąd uploadu zdjęcia (${response.status})`);
      }

      const fileUrl = await response.text();
      const cleanFileUrl = fileUrl.trim();
      const formattedUrl = cleanFileUrl.startsWith('/') ? cleanFileUrl : `/${cleanFileUrl}`;

      setMainImageUrl(formattedUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setIsAuthenticated(false);
      setError('Musisz być zalogowany, aby edytować przepisy');
      navigate('/login');
      return;
    }

    setIsAuthenticated(true);

    fetchRecipeDetails();

    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const toolbar = editor.getModule('toolbar');
      toolbar.addHandler('image', imageHandler);
      resizePastedImages();
    }
  }, [navigate, t, currentUser]);

  const fetchRecipeDetails = async () => {
    try {
      setLoading(true);

      // Pobieramy token bezpośrednio z localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Brak tokenu autoryzacji. Zaloguj się ponownie.');
      }

      // Pobieramy kategorie
      const categoriesResponse = await fetch('http://localhost:8080/api/v1/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!categoriesResponse.ok) {
        throw new Error('Nie udało się pobrać kategorii');
      }

      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);

      // Pobieramy szczegóły przepisu
      const response = await fetch(`http://localhost:8080/api/v1/recipes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Nie znaleziono przepisu');
      }

      const recipeData = await response.json();

      // Debugowanie informacji o użytkowniku i uprawnieniach
      const userEmail = currentUser?.email;
      const authorEmail = recipeData.author?.email;
      const userRole = currentUser?.role;

      console.log('Debug - Informacje o użytkowniku:', {
        userEmail,
        authorEmail,
        userRole,
        recipeAuthor: recipeData.author
      });

      // Użytkownik ma uprawnienia do edycji przepisu, jeśli jest jego autorem lub ma rolę ADMIN
      const canEdit = userEmail === authorEmail || userRole === 'ADMIN';

      console.log('Czy użytkownik może edytować przepis:', canEdit);

      if (!canEdit) {
        // Użytkownik nie ma uprawnień do edycji tego przepisu
        setError('Brak uprawnień do edycji tego przepisu');
        setTimeout(() => {
          navigate(`/recipes/${id}`);
        }, 2000);
        return;
      }

      // Jeśli użytkownik ma uprawnienia, kontynuujemy wypełnianie formularza

      setTitle(recipeData.title || '');
      setDescription(recipeData.description || '');

      if (recipeData.category && recipeData.category.id !== undefined) {
        const catId = recipeData.category.id.toString();
        setCategoryId(catId);
      } else {
        setCategoryId('');
      }

      let prepTime = '';

      if (recipeData.estimatedTimeToPrepare) {
        if (typeof recipeData.estimatedTimeToPrepare === 'string') {
          const match = recipeData.estimatedTimeToPrepare.match(/\d+/);
          if (match) {
            if ((recipeData.estimatedTimeToPrepare.includes('godzin') ||
                recipeData.estimatedTimeToPrepare.includes('godz')) &&
                !recipeData.estimatedTimeToPrepare.includes('min')) {
              prepTime = (parseInt(match[0]) * 60).toString();
            } else {
              prepTime = match[0];
            }
          }
        } else if (typeof recipeData.estimatedTimeToPrepare === 'number') {
          prepTime = recipeData.estimatedTimeToPrepare.toString();
        }
      }

      setEstimatedTimeToPrepare(prepTime);

      setMainImageUrl(recipeData.mainImageUrl || '');

      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        if (typeof recipeData.ingredients[0] === 'string') {
          setIngredients(recipeData.ingredients.map(ing => ({ name: ing, amount: '', unit: '' })));
        } else {
          setIngredients(recipeData.ingredients.map(ing => {
            if (typeof ing === 'string') return { name: ing, amount: '', unit: '' };

            return {
              name: ing.name || '',
              amount: ing.amount || '',
              unit: ing.unit || ''
            };
          }));
        }
      } else {
        setIngredients([{ name: '', amount: '', unit: '' }]);
      }

      if (recipeData.tags && recipeData.tags.length > 0) {
        // Poprawne ustawienie tagów jako stringów - dostosowanie do modelu Recipe.java
        // Obsługujemy zarówno przypadek, gdy tagi są obiektami, jak i gdy są stringami
        setTags(recipeData.tags.map(tag => {
          return typeof tag === 'string' ? tag : (tag.name || '');
        }));
      } else {
        setTags(['']);
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    // Sprawdzenie, czy wszystkie istniejące składniki są wypełnione
    if (ingredients.some(ingredient => ingredient.name.trim() === '')) {
      setError('Proszę wypełnić wszystkie istniejące składniki przed dodaniem nowego');
      return;
    }
    setError(null); // Wyczyść komunikat o błędzie, jeśli dodanie jest możliwe
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const removeIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
    setError(null); // Wyczyść komunikat o błędzie po usunięciu
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addTag = () => {
    // Sprawdzenie, czy wszystkie istniejące tagi są wypełnione
    if (tags.some(tag => tag.trim() === '')) {
      setError('Proszę wypełnić wszystkie istniejące tagi przed dodaniem nowego');
      return;
    }
    setError(null); // Wyczyść komunikat o błędzie, jeśli dodanie jest możliwe
    setTags([...tags, '']);
  };

  const removeTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
    setError(null); // Wyczyść komunikat o błędzie po usunięciu
  };

  const updateTag = (index, value) => {
    const newTags = [...tags];
    newTags[index] = value;
    setTags(newTags);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setError('Musisz być zalogowany, aby edytować przepisy');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Pobieramy token bezpośrednio z localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Brak tokenu autoryzacji. Zaloguj się ponownie.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      }

      // Przygotowujemy tagi jako listę stringów zgodnie z modelem Recipe.java
      const formattedTags = tags
        .filter(tag => tag && tag.trim() !== '')
        .map(tag => tag.trim());

      // Przygotowujemy dane do wysłania
      const recipeData = {
        title,
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        estimatedTimeToPrepare: estimatedTimeToPrepare ? parseInt(estimatedTimeToPrepare) : null,
        mainImageUrl,
        ingredients: ingredients.filter(ing => ing.name.trim() !== ''),
        tags: formattedTags
      };

      // Dodajemy szczegółowy log danych wysyłanych do backendu
      console.log('Dane przepisu wysyłane do backendu:', JSON.stringify(recipeData, null, 2));
      console.log('Wysyłanie żądania aktualizacji przepisu z tokenem:', token);

      const response = await fetch(`http://localhost:8080/api/v1/recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recipeData)
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Brak uprawnień do edycji tego przepisu');
        }

        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Błąd podczas aktualizacji przepisu');
        } catch (jsonError) {
          // Jeśli nie można sparsować JSON, zwróć ogólny komunikat z kodem statusu
          throw new Error(`Błąd podczas aktualizacji przepisu (Kod: ${response.status})`);
        }
      }

      const updatedRecipe = await response.json();

      setSuccess(true);
      setTimeout(() => {
        navigate(`/recipes/${updatedRecipe.id}`);
      }, 1500);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const shortenImageUrl = (url) => {
    if (!url) return '';
    if (url.length <= 30) return url;
    return url.substring(0, 15) + '...' + url.substring(url.length - 15);
  };

  if (loading && !recipeOwnerId) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Ładowanie...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-center mb-4">
                <h2>{t('editRecipe', 'Edytuj przepis')}</h2>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{t('recipeUpdatedSuccess', 'Przepis został pomyślnie zaktualizowany!')}</Alert>}

              <Form onSubmit={handleSubmit}>
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

                <Form.Group className="mb-3">
                  <Form.Label>{t('recipeDescription', 'Opis przepisu')} *</Form.Label>
                  <QuillWrapper
                    ref={quillRef}
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    modules={modules}
                    formats={formats}
                    style={{ height: '300px', marginBottom: '50px' }}
                    className="recipe-editor"
                  />
                  <div style={{ height: '50px' }}></div>
                </Form.Group>

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

                <Form.Group className="mb-3">
                  <Form.Label>{t('mainImageUpload', 'Zdjęcie główne')}</Form.Label>
                  <div className="d-flex mb-2">
                    {mainImageUrl && (
                      <div className="me-3">
                        <AuthorizedImage
                          src={mainImageUrl}
                          alt={title}
                          style={{maxWidth: '100%', maxHeight: 200}}
                          className="mb-2"
                        />
                      </div>
                    )}
                    <Form.Control
                      type="text"
                      value={mainImageUrl}
                      onChange={(e) => setMainImageUrl(e.target.value)}
                      placeholder="URL do zdjęcia"
                      className="d-none"
                    />
                  </div>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                  />
                </Form.Group>

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
                        <Col xs={4}>
                          <Form.Control
                            placeholder={t('ingredientName', 'Nazwa składnika')}
                            value={ing.name}
                            onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                            required
                          />
                        </Col>
                        <Col xs={4}>
                          <Form.Control
                            placeholder={t('ingredientAmount', 'Ilość')}
                            value={ing.amount}
                            onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                          />
                        </Col>
                        <Col xs={3}>
                          <Form.Control
                            placeholder={t('ingredientUnit', 'Jednostka')}
                            value={ing.unit}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
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

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0">{t('tags', 'Tagi')}</Form.Label>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={addTag}
                      type="button"
                    >
                      <i className="fas fa-plus me-1"></i> {t('addTag', 'Dodaj tag')}
                    </Button>
                  </div>

                  {tags.map((tag, index) => (
                    <div key={index} className="tag-row mb-2">
                      <Row>
                        <Col xs={11}>
                          <Form.Control
                            placeholder={t('tagName', 'Nazwa tagu')}
                            value={tag}
                            onChange={(e) => updateTag(index, e.target.value)}
                          />
                        </Col>
                        <Col xs={1} className="d-flex align-items-center">
                          {index > 0 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeTag(index)}
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

                <div className="mt-4 d-flex justify-content-between">
                  <Button variant="outline-secondary" onClick={() => navigate(`/recipes/${id}`)}>
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

export default EditRecipe;

