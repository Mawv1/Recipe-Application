import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Recipe.css';
import AuthorizedImage from './components/AuthorizedImage';

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
  const [tags, setTags] = useState(['']);

  // Ref do ReactQuill
  const quillRef = React.useRef();

  // Konfiguracja ReactQuill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }], // Dodane wyrównywanie tekstu: lewo, środek, prawo, justify
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      // Toggle to add extra line breaks when pasting HTML:
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'image', 'align' // Dodany format align
  ];

  // Funkcja do ograniczania wymiarów wklejanych obrazów
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
                // Ustaw maksymalną szerokość na 100% panelu edytora
                const maxWidth = '100%';

                // Pozwól na wklejenie obrazu i oczekuj, aż zostanie wklejony
                setTimeout(() => {
                  // Znajdź wszystkie obrazy w edytorze
                  const images = editor.root.querySelectorAll('img');
                  if (images.length > 0) {
                    // Ustaw styl na ostatni dodany obraz
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

        // Pobierz edytor i zaznaczenie
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();

        // Wstaw obraz do edytora na bieżącej pozycji kursora
        editor.insertEmbed(range.index, 'image', fileUrl);

        // Przesuń kursor po dodanym obrazie
        editor.setSelection(range.index + 1);

        console.log('Dodano obraz do opisu:', fileUrl);
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
    resizePastedImages();
  }, []);

  // Pobieranie kategorii przepisów
  const fetchCategories = async (token) => {
    console.log('Próba pobrania kategorii...');
    try {
      const response = await fetch('http://localhost:8080/api/v1/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Status odpowiedzi kategorii:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Błąd odpowiedzi kategorii:', errorText);
        throw new Error(`${t('fetchCategoriesError', 'Nie udało się pobrać kategorii')}: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Otrzymane kategorie:', data);

      // Sprawdzamy strukturę odpowiedzi
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data.content && Array.isArray(data.content)) {
        setCategories(data.content);
      } else {
        console.error('Nieoczekiwana struktura danych kategorii:', data);
        setCategories([]);
      }
    } catch (err) {
      console.error('Błąd podczas pobierania kategorii:', err);
      setError(err.message);
    }
  };

  // Dodawanie nowego pola składnika
  const addIngredient = () => {
    // Sprawdzenie, czy wszystkie istniejące składniki są wypełnione
    if (ingredients.some(ingredient => !ingredient.name.trim())) {
      setError('Proszę wypełnić wszystkie istniejące składniki przed dodaniem nowego');
      return;
    }
    setError(null); // Wyczyść komunikat o błędzie, jeśli dodanie jest możliwe
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  // Usuwanie pola składnika
  const removeIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
    setError(null); // Wyczyść komunikat o błędzie po usunięciu
  };

  // Aktualizacja pola składnika
  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  // Dodawanie nowego pola tagu
  const addTag = () => {
    // Sprawdzenie, czy wszystkie istniejące tagi są wypełnione
    if (tags.some(tag => tag.trim() === '')) {
      setError('Proszę wypełnić wszystkie istniejące tagi przed dodaniem nowego');
      return;
    }
    setError(null); // Wyczyść komunikat o błędzie, jeśli dodanie jest możliwe
    setTags([...tags, '']);
  };

  // Usuwanie pola tagu
  const removeTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
    setError(null); // Wyczyść komunikat o błędzie po usunięciu
  };

  // Aktualizacja pola tagu
  const updateTag = (index, value) => {
    const newTags = [...tags];
    newTags[index] = value;
    setTags(newTags);
  };

  // Obsługa uploadu zdjęcia głównego
  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Brak tokenu autoryzacji. Zaloguj się ponownie.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Rozpoczynam upload głównego zdjęcia...');
      const response = await fetch('http://localhost:8080/api/v1/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Brak tekstu błędu');
        console.error('Błąd uploadu, status:', response.status, response.statusText, 'Treść:', errorText);
        throw new Error(`Błąd uploadu zdjęcia (${response.status})`);
      }

      const fileUrl = await response.text();

      // Zapamiętujemy ścieżkę do pliku w stanie komponentu
      console.log('Otrzymana ścieżka z serwera:', fileUrl);

      // Sprawdź czy ścieżka zaczyna się od / i dodaj jeśli trzeba
      // Usuń wszytskie potencjalne zbędne spacje, znaki nowej linii itp.
      const cleanFileUrl = fileUrl.trim();
      const formattedUrl = cleanFileUrl.startsWith('/') ? cleanFileUrl : `/${cleanFileUrl}`;

      setMainImageUrl(formattedUrl);
      console.log('Zapisana ścieżka do zdjęcia głównego:', formattedUrl);

      // Zrób test, czy obraz jest dostępny
      try {
        const testResponse = await fetch(`http://localhost:8080${formattedUrl}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (testResponse.ok) {
          console.log('Obraz jest dostępny i zwraca odpowiedź 200 OK');
          const contentType = testResponse.headers.get('content-type');
          console.log('Typ zawartości obrazu:', contentType);
        } else {
          console.warn('Test dostępności obrazu nie powiódł się:', testResponse.status, testResponse.statusText);
        }
      } catch (testErr) {
        console.warn('Błąd podczas testowania dostępności obrazu:', testErr);
      }
    } catch (err) {
      console.error('Błąd podczas przesyłania głównego zdjęcia:', err);
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
    if (!title || !description || !categoryId || ingredients.some(ing => !ing.name)) {
      setError(t('formValidationError', 'Proszę wypełnić wszystkie wymagane pola'));
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Brak autoryzacji. Zaloguj się ponownie.');
      setLoading(false);
      return;
    }

    try {
      // Przygotowujemy tagi jako listę stringów zgodnie z modelem Recipe.java, tak jak w EditRecipe.js
      const formattedTags = tags
        .filter(tag => tag && tag.trim() !== '')
        .map(tag => tag.trim());

      console.log('Przygotowane tagi po formatowaniu:', formattedTags);

      // Próba konwersji estimatedTimeToPrepare na liczbę, jeśli zawiera tylko cyfry
      let prepTime = estimatedTimeToPrepare;
      const timeMatch = estimatedTimeToPrepare.match(/^\d+$/);
      if (timeMatch) {
        prepTime = parseInt(estimatedTimeToPrepare, 10);
      }

      // Przygotowanie danych do wysłania - dokładnie w takim samym formacie jak w EditRecipe.js
      const recipeData = {
        title,
        description,
        categoryId: parseInt(categoryId),
        estimatedTimeToPrepare: prepTime,
        mainImageUrl,
        ingredients: ingredients.filter(ing => ing.name.trim() !== ''),
        tags: formattedTags
      };

      console.log('Wysyłane dane (kompletny obiekt):', JSON.stringify(recipeData, null, 2));

      // Wysłanie żądania do API
      const response = await fetch('http://localhost:8080/api/v1/recipes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recipeData)
      });

      // W przypadku błędu 401 (Unauthorized) - użytkownik naprawdę nie ma autoryzacji
      if (response.status === 401) {
        console.error('Błąd autoryzacji - brak autoryzacji (401)');
        setError('Brak autoryzacji. Zaloguj się ponownie.');
        return;
      }

      // W przypadku błędu 403 (Forbidden) - user może nie mieć uprawnień, ale wciąż jest zalogowany
      if (response.status === 403) {
        console.error('Błąd uprawnień (403) - brak uprawnień do wykonania operacji');
        setError('Nie masz uprawnień do dodawania przepisów. Skontaktuj się z administratorem.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.log('Odpowiedź serwera nie jest w formacie JSON:', errorText);
        }
        console.error('Odpowiedź serwera:', errorData);
        throw new Error(errorData.message || t('addRecipeError', 'Nie udało się dodać przepisu'));
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
              <div className="d-flex justify-content-center mb-4">
                <h2>{t('addRecipe', 'Dodaj nowy przepis')}</h2>
              </div>

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
                      <AuthorizedImage src={mainImageUrl} alt="Podgląd zdjęcia" style={{maxWidth: '100%', maxHeight: 200}} />
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

                {/* Tagowanie */}
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
