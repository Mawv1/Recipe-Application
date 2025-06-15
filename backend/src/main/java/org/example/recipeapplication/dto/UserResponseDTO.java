package org.example.recipeapplication.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record UserResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String profilePicture,
        String email,
        String role,
        List<RecipeResponseDTO> recipes
) {
    public String getEmail() {
        return email != null ? email : "No email provided";
    }
}
