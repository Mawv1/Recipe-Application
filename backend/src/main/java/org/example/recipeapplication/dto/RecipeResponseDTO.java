package org.example.recipeapplication.dto;

import org.example.recipeapplication.model.RecipeStatus;

import java.time.LocalDateTime;
import java.util.List;

public record RecipeResponseDTO(
        Long id,
        String title,
        String description,
        Float rate,
        Integer ratingCount,
        Integer favoritesCount,
        String mainImageUrl,
        String estimatedTimeToPrepare,
        UserResponseDTO author,
        LocalDateTime dateOfCreation,
        RecipeStatus status,
        List<String> tags,
        List<IngredientResponseDTO> ingredients
) {}

