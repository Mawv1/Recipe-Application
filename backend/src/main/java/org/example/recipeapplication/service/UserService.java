package org.example.recipeapplication.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.UserRequestDTO;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.FollowedRecipe;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.repos.FollowedRecipeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository userRepository;
    private final FollowedRecipeRepository followedRecipeRepository;

    public UserResponseDTO updateUserProfile(Long id, UserRequestDTO dto) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setEmail(dto.email());
        user.setProfilePicture(dto.profilePicture());
        userRepository.save(user);
        return mapToDTO(user);
    }

    public List<FollowedRecipe> getUserFollowedRecipes(Long userId) {
        // Zakładam, że FollowedRecipe ma użytkowników, więc filtruję po userId
        return followedRecipeRepository.findAll().stream()
                .filter(fr -> fr.getUsers().stream().anyMatch(u -> u.getId().equals(userId)))
                .toList();
    }

    private UserResponseDTO mapToDTO(AppUser user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePicture()
        );
    }

    public UserResponseDTO getUserProfile(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return mapToDTO(user);
    }

    public UserResponseDTO getUserByEmail(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return mapToDTO(user);
    }
}


