package org.example.recipeapplication.controller;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.FollowedRecipeResponseDTO;
import org.example.recipeapplication.dto.RecipeResponseDTO;
import org.example.recipeapplication.dto.UserRequestDTO;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.service.FollowedRecipeService;
import org.example.recipeapplication.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final FollowedRecipeService followedRecipeService;

    /**
     * Endpoint do pobierania wszystkich użytkowników
     */
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    public UserResponseDTO updateProfile(@PathVariable Long id, @org.springframework.web.bind.annotation.RequestBody UserRequestDTO userRequestDTO) {
        return userService.updateUserProfile(id, userRequestDTO);
    }

    @GetMapping("/{userId}/followed-recipes")
    public ResponseEntity<Page<RecipeResponseDTO>> getUserFollowedRecipes(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(defaultValue = "followedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        return ResponseEntity.ok(followedRecipeService.getUserFollowedRecipesAsFullRecipes(userId, pageable));
    }

    @GetMapping("/me/followed-recipes")
    public ResponseEntity<?> getMyFollowedRecipes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(defaultValue = "followedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Użytkownik musi być zalogowany, aby pobrać swoje obserwowane przepisy
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Musisz być zalogowany, aby zobaczyć swoje obserwowane przepisy"));
        }

        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        return ResponseEntity.ok(followedRecipeService.getFollowedRecipesAsFullRecipes(userDetails.getUsername(), pageable));
    }

    @PostMapping("/me/followed-recipes/{recipeId}")
    public ResponseEntity<?> followRecipe(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Musisz być zalogowany, aby dodać przepis do ulubionych"));
        }
        FollowedRecipeResponseDTO followed = followedRecipeService.followRecipe(recipeId, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(followed);
    }

    @DeleteMapping("/me/followed-recipes/{recipeId}")
    public ResponseEntity<?> unfollowRecipe(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Musisz być zalogowany, aby usunąć przepis z ulubionych"));
        }
        followedRecipeService.unfollowRecipe(recipeId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/followed-recipes/{recipeId}/status")
    public ResponseEntity<Map<String, Boolean>> checkFollowStatus(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Sprawdzamy status śledzenia
        boolean isFollowed = followedRecipeService.isRecipeFollowed(recipeId, userDetails != null ? userDetails.getUsername() : null);

        // Jeśli przepis nie jest obserwowany, a użytkownik jest zalogowany,
        // upewniamy się, że przepis zostanie usunięty z listy obserwowanych
        if (!isFollowed && userDetails != null) {
            followedRecipeService.unfollowRecipe(recipeId, userDetails.getUsername());
        }

        return ResponseEntity.ok(Map.of("followed", isFollowed));
    }

    @GetMapping("/{userId}")
    public UserResponseDTO getUserProfile(@PathVariable Long userId) {
        return userService.getUserProfile(userId);
    }

    @GetMapping("/email/{email}")
    public UserResponseDTO getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.getUserByEmail(userDetails.getUsername()));
    }

    @PutMapping("{userId}/password")
    public ResponseEntity<?> updatePassword(
            @PathVariable Long userId,
            @RequestParam(required = false) String oldPassword,
            @RequestParam(required = false) String newPassword,
            @RequestBody(required = false) Map<String, String> passwordData,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            // Sprawdzamy, czy użytkownik jest zalogowany
            if (userDetails == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Musisz być zalogowany, aby zmienić hasło"));
            }

            // Pobieramy hasła z parametrów URL lub z ciała żądania
            String oldPass = oldPassword;
            String newPass = newPassword;

            // Jeśli parametry URL są puste, próbujemy pobrać z ciała żądania
            if ((oldPass == null || newPass == null) && passwordData != null) {
                oldPass = passwordData.get("oldPassword");
                newPass = passwordData.get("newPassword");
            }

            if (oldPass == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Stare hasło jest wymagane"));
            }

            if (newPass == null || newPass.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("message", "Nowe hasło musi mieć co najmniej 8 znaków"));
            }

            // Sprawdzamy uprawnienia
            String userEmail = userService.getUserProfile(userId).getEmail();
            if (!userDetails.getUsername().equals(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Nie masz uprawnień do zmiany hasła tego użytkownika"));
            }

            userService.updatePassword(userId, oldPass, newPass);
            return ResponseEntity.ok(Map.of("message", "Hasło zostało pomyślnie zaktualizowane"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Wystąpił błąd podczas zmiany hasła: " + e.getMessage()));
        }
    }
}

