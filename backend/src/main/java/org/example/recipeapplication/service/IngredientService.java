package org.example.recipeapplication.service;

import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.IngredientRequestDTO;
import org.example.recipeapplication.dto.IngredientResponseDTO;
import org.example.recipeapplication.model.Ingredient;
import org.example.recipeapplication.repos.IngredientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;

    public List<IngredientResponseDTO> searchIngredients(String name) {
        return ingredientRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::mapToDTO)
                .toList();
    }

    public IngredientResponseDTO addIngredient(IngredientRequestDTO dto) {
        Ingredient ingredient = new Ingredient();
        ingredient.setName(dto.name());
        ingredient.setAmount(dto.amount());
        ingredient.setUnit(dto.unit());
        Ingredient saved = ingredientRepository.save(ingredient);
        return mapToDTO(saved);
    }

    private IngredientResponseDTO mapToDTO(Ingredient ingredient) {
        return new IngredientResponseDTO(
                ingredient.getId(),
                ingredient.getName(),
                ingredient.getAmount(),
                ingredient.getUnit()
        );
    }
}

