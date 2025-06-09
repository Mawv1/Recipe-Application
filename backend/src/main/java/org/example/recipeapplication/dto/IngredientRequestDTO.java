package org.example.recipeapplication.dto;

import jakarta.validation.constraints.NotBlank;

public record IngredientRequestDTO(
        @NotBlank String name,
        @NotBlank String amount,
        String unit
) {}