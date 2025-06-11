package org.example.recipeapplication.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String profilePicture,
        String email
) {
    public String getEmail() {
        return email != null ? email : "No email provided";
    }
}
