package org.example.recipeapplication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RecipeRequestDTO(
        @NotBlank String title,
        @NotBlank String description,
        String estimatedTimeToPrepare,
        @NotEmpty List<IngredientRequestDTO> ingredients,
        @NotNull Long categoryId,
        List<String> tags
) {
}
