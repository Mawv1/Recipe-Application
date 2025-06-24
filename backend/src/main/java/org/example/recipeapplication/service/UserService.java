package org.example.recipeapplication.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.*;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.FollowedRecipe;
import org.example.recipeapplication.model.Recipe;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.repos.FollowedRecipeRepository;
import org.example.recipeapplication.repos.RecipeRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository userRepository;
    private final FollowedRecipeRepository followedRecipeRepository;
    private final PasswordEncoder passwordEncoder;
    private final RecipeRepository recipeRepository;

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
        // Po modyfikacji modelu FollowedRecipe możemy bezpośrednio użyć repozytorium
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return followedRecipeRepository.findByUser(user);
    }

    /**
     * Pobiera listę wszystkich użytkowników
     * @return Lista użytkowników w formie DTO
     */
    public List<UserResponseDTO> getAllUsers() {
        List<AppUser> users = userRepository.findAll();
        return users.stream()
                .map(this::mapToDTOWithoutRecipes)
                .collect(Collectors.toList());
    }

    private UserResponseDTO mapToDTO(AppUser user) {
        // Pobierz listę przepisów użytkownika i zmapuj do RecipeResponseDTO
        List<RecipeResponseDTO> recipes = user.getRecipes() != null ?
            user.getRecipes().stream().map(this::mapRecipeToDTO).toList() : List.of();
        return new UserResponseDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePicture(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null,
                user.isBanned(),
                user.getBanReason(),
                recipes
        );
    }

    /**
     * Mapuje obiekt użytkownika do DTO bez listy przepisów - dla endpointu /users
     * @param user Obiekt użytkownika do mapowania
     * @return DTO użytkownika bez listy przepisów
     */
    private UserResponseDTO mapToDTOWithoutRecipes(AppUser user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePicture(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null,
                user.isBanned(),
                user.getBanReason(),
                null // Nie zwracamy przepisów
        );
    }

    private RecipeResponseDTO mapRecipeToDTO(Recipe recipe) {
        return new RecipeResponseDTO(
                recipe.getId(),
                recipe.getTitle(),
                recipe.getDescription(),
                recipe.getRating(),
                recipe.getRatingCount() != null ? recipe.getRatingCount() : 0,
                recipe.getFavoritesCount() != null ? recipe.getFavoritesCount() : 0,
                recipe.getMainImageUrl(),
                recipe.getEstimatedTimeToPrepare(),
                null, // author (unikamy cykliczności)
                recipe.getDateOfCreation() != null ? recipe.getDateOfCreation().toLocalDateTime() : null,
                recipe.getStatus(),
                recipe.getTags() != null ? recipe.getTags() : List.of(),
                recipe.getIngredients() != null ? recipe.getIngredients().stream()
                        .map(ing -> new IngredientResponseDTO(
                                ing.getId(),
                                ing.getName(),
                                ing.getAmount(),
                                ing.getUnit()))
                        .collect(Collectors.toList()) : List.of(),
                recipe.getComments() != null ? recipe.getComments().stream()
                        .map(comment -> new CommentResponseDTO(
                                comment.getId(),
                                comment.getContent(),
                                comment.getLikesCount(),
                                comment.getDislikesCount(),
                                new UserResponseDTO(
                                        comment.getAuthor().getId(),
                                        comment.getAuthor().getFirstName(),
                                        comment.getAuthor().getLastName(),
                                        comment.getAuthor().getProfilePicture(),
                                        comment.getAuthor().getEmail(),
                                        null, // rola nie jest potrzebna w komentarzu
                                        comment.getAuthor().isBanned(),
                                        comment.getAuthor().getBanReason(),
                                        null // nie pobieramy przepisów autora w komentarzu
                                ),
                                comment.getDateOfCreation() != null ? comment.getDateOfCreation().toLocalDateTime() : null
                        )).collect(Collectors.toList()) : List.of()
        );
    }

    public UserResponseDTO getUserProfile(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        // Pobierz przepisy użytkownika z repozytorium, aby wymusić inicjalizację kolekcji
        List<Recipe> recipes = recipeRepository.findByAuthor(user, Pageable.unpaged()).getContent();
        user.setRecipes(recipes);
        return mapToDTO(user);
    }

    public UserResponseDTO getUserByEmail(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        // Pobierz przepisy użytkownika z repozytorium, aby wymusić inicjalizację kolekcji
        List<Recipe> recipes = recipeRepository.findByAuthor(user, Pageable.unpaged()).getContent();
        user.setRecipes(recipes);
        return mapToDTO(user);
    }

    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Użytkownik nie znaleziony"));

        // Sprawdzamy, czy stare hasło jest poprawne przy użyciu PasswordEncoder
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Stare hasło jest niepoprawne");
        }

        // Szyfrujemy nowe hasło przed zapisaniem
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}

