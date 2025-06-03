package org.example.recipeapplication.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserRequestDTO(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email String email,
        String profilePicture
) {}
