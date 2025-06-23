package org.example.recipeapplication.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CommentRequestDTO(
        @NotBlank String content,
        Integer likesCount,
        Integer dislikesCount,
        @NotNull Long recipeId
) {}
