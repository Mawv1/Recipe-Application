package org.example.recipeapplication.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.IngredientRequestDTO;
import org.example.recipeapplication.dto.RecipeRequestDTO;
import org.example.recipeapplication.dto.RecipeResponseDTO;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.model.*;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.repos.CategoryRepository;
import org.example.recipeapplication.repos.IngredientRepository;
import org.example.recipeapplication.repos.RecipeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final CategoryRepository categoryRepository;
    private final AppUserRepository userRepository;
    private final IngredientRepository ingredientRepository;
    private final FileStorageService fileStorageService;

    public Page<RecipeResponseDTO> getAllRecipes(Pageable pageable) {
        return recipeRepository.findByStatus(org.example.recipeapplication.model.RecipeStatus.ACCEPTED, pageable)
                .map(this::mapToDTO);
    }

    public Page<RecipeResponseDTO> getPendingRecipes(Pageable pageable) {
        return recipeRepository.findByStatus(org.example.recipeapplication.model.RecipeStatus.PENDING, pageable)
                .map(this::mapToDTO);
    }

    public RecipeResponseDTO changeRecipeStatus(Long recipeId, org.example.recipeapplication.model.RecipeStatus status) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Recipe not found"));
        recipe.setStatus(status);
        recipeRepository.save(recipe);
        return mapToDTO(recipe);
    }

    public Page<RecipeResponseDTO> searchRecipes(String search, Pageable pageable) {
        return recipeRepository.findByTitleContainingIgnoreCase(search, pageable).map(this::mapToDTO);
    }

    public RecipeResponseDTO addRecipe(RecipeRequestDTO dto, String email) {
        Recipe recipe = new Recipe();
        recipe.setTitle(dto.title());
        recipe.setDescription(dto.description());
        recipe.setEstimatedTimeToPrepare(dto.estimatedTimeToPrepare());
        recipe.setMainImageUrl(dto.mainImageUrl());
        recipe.setDateOfCreation(new Timestamp(System.currentTimeMillis()));
        recipe.setRating(0f);
        recipe.setRatingCount(0);
        recipe.setFavoritesCount(0);
        recipe.setStatus(org.example.recipeapplication.model.RecipeStatus.PENDING);

        AppUser author = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Author not found with username: " + email));
        recipe.setAuthor(author);

        Category category = categoryRepository.findById(dto.categoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        recipe.setCategory(category);

        // ingredients - map DTO -> entities and save
        List<Ingredient> ingredients = dto.ingredients().stream()
                .map(ingredientDTO -> {
                    Ingredient ing = new Ingredient();
                    ing.setName(ingredientDTO.name());
                    ing.setAmount(ingredientDTO.amount());
                    ing.setUnit(ingredientDTO.unit());
                    return ingredientRepository.save(ing);
                }).toList();

        recipe.setIngredients(ingredients);

        Recipe saved = recipeRepository.save(recipe);
        return mapToDTO(saved);
    }

    /**
     * Dodaje nowy przepis wraz ze zdjęciem
     */
    public RecipeResponseDTO addRecipeWithImage(RecipeRequestDTO dto, MultipartFile imageFile, String email) {
        // Zapisujemy zdjęcie i uzyskujemy jego URL
        String imageUrl = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            imageUrl = fileStorageService.storeRecipeImage(imageFile);
        }

        // Jeśli w DTO był już ustawiony URL zdjęcia głównego, to nie nadpisujemy go
        if (imageUrl != null && (dto.mainImageUrl() == null || dto.mainImageUrl().isEmpty())) {
            // Tworzymy nowe DTO z ustawionym URL zdjęcia głównego
            RecipeRequestDTO updatedDto = new RecipeRequestDTO(
                dto.title(),
                dto.description(),
                dto.estimatedTimeToPrepare(),
                imageUrl,
                dto.ingredients(),
                dto.categoryId(),
                dto.tags()
            );
            return addRecipe(updatedDto, email);
        } else {
            // Używamy oryginalnego DTO
            return addRecipe(dto, email);
        }
    }

    /**
     * Aktualizuje zdjęcie główne dla istniejącego przepisu
     */
    public RecipeResponseDTO updateRecipeImage(Long recipeId, MultipartFile imageFile, String email) {
        // Sprawdzamy, czy przepis istnieje i czy użytkownik ma uprawnienia
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Recipe not found with id: " + recipeId));

        // Sprawdzamy czy zalogowany użytkownik jest autorem przepisu
        if (!recipe.getAuthor().getEmail().equals(email)) {
            throw new SecurityException("You are not authorized to update this recipe.");
        }

        // Usuwamy stare zdjęcie, jeśli istnieje
        if (recipe.getMainImageUrl() != null && !recipe.getMainImageUrl().isEmpty()) {
            fileStorageService.deleteFile(recipe.getMainImageUrl());
        }

        // Zapisujemy nowe zdjęcie
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = fileStorageService.storeRecipeImage(imageFile);
            recipe.setMainImageUrl(imageUrl);
            recipe.setDateOfModification(new Timestamp(System.currentTimeMillis()));
            Recipe updatedRecipe = recipeRepository.save(recipe);
            return mapToDTO(updatedRecipe);
        } else {
            throw new IllegalArgumentException("Image file cannot be empty");
        }
    }

    private RecipeResponseDTO mapToDTO(Recipe recipe) {
        return new RecipeResponseDTO(
                recipe.getId(),
                recipe.getTitle(),
                recipe.getDescription(),
                recipe.getRating(),
                recipe.getRatingCount() != null ? recipe.getRatingCount() : 0,
                recipe.getFavoritesCount() != null ? recipe.getFavoritesCount() : 0,
                recipe.getMainImageUrl(),
                recipe.getEstimatedTimeToPrepare(),
                new UserResponseDTO(
                        recipe.getAuthor().getId(),
                        recipe.getAuthor().getFirstName(),
                        recipe.getAuthor().getLastName(),
                        recipe.getAuthor().getProfilePicture(),
                        recipe.getAuthor().getEmail(),
                        recipe.getAuthor().getRole() != null ? recipe.getAuthor().getRole().name() : null,
                        null // nie pobieramy przepisów autora w DTO przepisu
                ),
                recipe.getDateOfCreation() != null ? recipe.getDateOfCreation().toLocalDateTime() : null,
                recipe.getStatus(),
                recipe.getTags() != null ? recipe.getTags() : List.of()
        );
    }

    public Page<RecipeResponseDTO> getRecipesByCategory(Long categoryId, Pageable pageable) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        return recipeRepository.findByCategory(category, pageable).map(this::mapToDTO);
    }

    public Page<RecipeResponseDTO> getUserRecipes(Long userId, Pageable pageable) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return recipeRepository.findByAuthor(user, pageable).map(this::mapToDTO);
    }

    public Optional<RecipeResponseDTO> getRecipeById(Long id) {
        return recipeRepository.findById(id).map(this::mapToDTO);
    }

    public void deleteRecipe(Long id, String email) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Recipe not found with id: " + id));

        if (!recipe.getAuthor().getEmail().equals(email)) {
            throw new SecurityException("You are not authorized to delete this recipe.");
        }

        recipeRepository.delete(recipe);
    }
}

