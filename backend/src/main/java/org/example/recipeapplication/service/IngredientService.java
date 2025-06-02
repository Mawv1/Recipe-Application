package org.example.recipeapplication.service;

import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.model.Ingredient;
import org.example.recipeapplication.repos.IngredientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientService {
    private final IngredientRepository ingredientRepository;

    public List<Ingredient> searchIngredients(String name) {
        return ingredientRepository.findByNameContainingIgnoreCase(name);
    }

    public Ingredient addIngredient(Ingredient ingredient) {
        return ingredientRepository.save(ingredient);
    }
}
