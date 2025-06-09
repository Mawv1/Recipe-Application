package org.example.recipeapplication.dto;

import java.time.LocalDateTime;

public record CommentResponseDTO(
        Long id,
        String content,
        Double rate,
        UserResponseDTO author,
        LocalDateTime dateOfCreation
) {}
