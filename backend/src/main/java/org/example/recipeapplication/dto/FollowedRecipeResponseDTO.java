package org.example.recipeapplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FollowedRecipeResponseDTO {
    private Long id;
    private Long userId;
    private Long recipeId;
    private String recipeTitle;
    private LocalDateTime followedAt;
}
