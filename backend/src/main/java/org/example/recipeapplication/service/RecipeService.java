package org.example.recipeapplication.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.IngredientRequestDTO;
import org.example.recipeapplication.dto.RecipeRequestDTO;
import org.example.recipeapplication.dto.RecipeResponseDTO;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.Category;
import org.example.recipeapplication.model.Ingredient;
import org.example.recipeapplication.model.Recipe;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.repos.CategoryRepository;
import org.example.recipeapplication.repos.IngredientRepository;
import org.example.recipeapplication.repos.RecipeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final CategoryRepository categoryRepository;
    private final AppUserRepository userRepository;
    private final IngredientRepository ingredientRepository;

    public Page<RecipeResponseDTO> getAllRecipes(Pageable pageable) {
        return recipeRepository.findAll(pageable).map(this::mapToDTO);
    }

    public Page<RecipeResponseDTO> searchRecipes(String search, Pageable pageable) {
        return recipeRepository.findByTitleContainingIgnoreCase(search, pageable).map(this::mapToDTO);
    }

    public RecipeResponseDTO addRecipe(RecipeRequestDTO dto) {
        Recipe recipe = new Recipe();
        recipe.setTitle(dto.title());
        recipe.setDescription(dto.description());
        recipe.setEstimatedTimeToPrepare(dto.estimatedTimeToPrepare());
        recipe.setDateOfCreation(new Timestamp(System.currentTimeMillis()));
        recipe.setRate(0f);

        AppUser author = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Author not found"));
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

    private RecipeResponseDTO mapToDTO(Recipe recipe) {
        return new RecipeResponseDTO(
                recipe.getId(),
                recipe.getTitle(),
                recipe.getDescription(),
                recipe.getRate(),
                recipe.getEstimatedTimeToPrepare(),
                new UserResponseDTO(
                        recipe.getAuthor().getId(),
                        recipe.getAuthor().getFirstName(),
                        recipe.getAuthor().getLastName(),
                        recipe.getAuthor().getProfilePicture()
                ),
                recipe.getDateOfCreation().toLocalDateTime()
        );
    }
}

