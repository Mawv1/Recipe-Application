package org.example.recipeapplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RatingResponseDTO {
    private Long id;
    private Long userId;
    private Long recipeId;
    private Integer value;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
