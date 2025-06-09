package org.example.recipeapplication.dto;

public record IngredientResponseDTO(
        Long id,
        String name,
        String amount,
        String unit
) {}
