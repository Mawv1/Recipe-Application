package org.example.recipeapplication.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RecipeResponseDTO(
        Long id,
        String title,
        String description,
        Float rate,
        Integer ratingCount,
        Integer favoritesCount,
        String estimatedTimeToPrepare,
        UserResponseDTO author,
        LocalDateTime dateOfCreation
) {}

