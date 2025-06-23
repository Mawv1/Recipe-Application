package org.example.recipeapplication.dto;

import java.time.LocalDateTime;

public record CommentResponseDTO(
        Long id,
        String content,
        Integer likesCount,
        Integer dislikesCount,
        UserResponseDTO author,
        LocalDateTime dateOfCreation
) {}
