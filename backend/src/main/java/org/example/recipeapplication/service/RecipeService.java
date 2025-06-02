package org.example.recipeapplication.service;

import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.model.Recipe;
import org.example.recipeapplication.repos.CategoryRepository;
import org.example.recipeapplication.repos.RecipeRepository;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecipeService {
    private final RecipeRepository recipeRepository;
    private final CategoryRepository categoryRepository;

    public Recipe createRecipe(Recipe recipe) {
        recipe.setDateOfCreation(new Timestamp(System.currentTimeMillis()));
        recipe.setDateOfModification(new Timestamp(System.currentTimeMillis()));
        return recipeRepository.save(recipe);
    }

    public Recipe updateRecipe(Long id, Recipe recipe) {
        return recipeRepository.findById(id)
                .map(existingRecipe -> {
                    existingRecipe.setTitle(recipe.getTitle());
                    existingRecipe.setDescription(recipe.getDescription());
                    existingRecipe.setIngredients(recipe.getIngredients());
                    existingRecipe.setCategory(recipe.getCategory());
                    existingRecipe.setDateOfModification(new Timestamp(System.currentTimeMillis()));
                    return recipeRepository.save(existingRecipe);
                })
                .orElseThrow(() -> new RuntimeException("Recipe not found"));
    }

    public List<Recipe> getRecipesByCategory(Long categoryId) {
        return recipeRepository.findByCategoryId(categoryId);
    }

    public List<Recipe> searchRecipes(String title) {
        return recipeRepository.findByTitleContainingIgnoreCase(title);
    }
}