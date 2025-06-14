package org.example.recipeapplication.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.recipeapplication.dto.FollowedRecipeResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.FollowedRecipe;
import org.example.recipeapplication.model.Recipe;
import org.example.recipeapplication.model.Role;
import org.example.recipeapplication.repos.FollowedRecipeRepository;
import org.example.recipeapplication.repos.RecipeRepository;
import org.example.recipeapplication.repos.AppUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowedRecipeService {
    private static final String GUEST_EMAIL = "guest@example.com";

    private final FollowedRecipeRepository followedRecipeRepository;
    private final RecipeRepository recipeRepository;
    private final AppUserRepository userRepository;

    @Transactional
    public FollowedRecipeResponseDTO followRecipe(Long recipeId, String userEmail) {
        AppUser user = getUserForOperations(userEmail);

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Przepis nie znaleziony"));

        Optional<FollowedRecipe> existingFollowed = followedRecipeRepository.findByUserAndRecipe(user, recipe);

        if (existingFollowed.isPresent()) {
            return mapToDTO(existingFollowed.get());
        }

        FollowedRecipe followedRecipe = new FollowedRecipe();
        followedRecipe.setUser(user);
        followedRecipe.setRecipe(recipe);

        // Zwiększ licznik polubień przepisu
        if (recipe.getFavoritesCount() == null) {
            recipe.setFavoritesCount(1);
        } else {
            recipe.setFavoritesCount(recipe.getFavoritesCount() + 1);
        }
        recipeRepository.save(recipe);

        FollowedRecipe savedFollowed = followedRecipeRepository.save(followedRecipe);
        return mapToDTO(savedFollowed);
    }

    @Transactional(readOnly = true)
    public Page<FollowedRecipeResponseDTO> getFollowedRecipes(String userEmail, Pageable pageable) {
        log.info("Pobieranie obserwowanych przepisów dla użytkownika: {}", userEmail);

        AppUser user = getUserForOperations(userEmail);
        log.info("Znaleziono użytkownika z ID: {}", user.getId());

        // Dla bezpieczeństwa sprawdzamy czy faktycznie są to obserwowane przepisy
        // i filtrujemy tylko te, które nadal są obserwowane
        Page<FollowedRecipe> followedRecipesPage = followedRecipeRepository.findByUser(user, pageable);

        // Przepisy już są pobrane z bazy danych, więc jeżeli są w tabeli FollowedRecipe,
        // to znaczy, że są obserwowane. Status followedRecipe.isFollowed jest zawsze true.
        // Nie musimy dodatkowo filtrować, bo usunięcie obserwacji powoduje usunięcie rekordu z tabeli.

        log.info("Znaleziono {} obserwowanych przepisów", followedRecipesPage.getTotalElements());
        return followedRecipesPage.map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public boolean isRecipeFollowed(Long recipeId, String userEmail) {
        log.info("Sprawdzanie czy przepis {} jest obserwowany przez użytkownika: {}", recipeId, userEmail);

        // Jeśli nie ma zalogowanego użytkownika, przepis nie jest śledzony
        if (userEmail == null) {
            log.warn("Użytkownik nie jest zalogowany, zwracam false");
            return false;
        }

        AppUser user = getUserForOperations(userEmail);
        log.info("Znaleziono użytkownika z ID: {}, email: {}", user.getId(), user.getEmail());

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Przepis nie znaleziony"));

        boolean isFollowed = followedRecipeRepository.existsByUserAndRecipe(user, recipe);
        log.info("Czy przepis {} jest obserwowany przez użytkownika {}: {}", recipeId, user.getId(), isFollowed);

        return isFollowed;
    }

    @Transactional
    public void unfollowRecipe(Long recipeId, String userEmail) {
        // Jeśli użytkownik nie jest zalogowany, nie ma co usuwać
        if (userEmail == null) {
            return;
        }

        AppUser user = getUserForOperations(userEmail);

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Przepis nie znaleziony"));

        // Sprawdzamy, czy użytkownik faktycznie obserwował ten przepis
        boolean wasFollowed = followedRecipeRepository.existsByUserAndRecipe(user, recipe);

        if (wasFollowed) {
            // Zmniejszamy licznik polubień tylko jeśli faktycznie usuwamy obserwację
            if (recipe.getFavoritesCount() != null && recipe.getFavoritesCount() > 0) {
                recipe.setFavoritesCount(recipe.getFavoritesCount() - 1);
                recipeRepository.save(recipe);
                log.info("Zmniejszono licznik polubień dla przepisu {} do {}", recipeId, recipe.getFavoritesCount());
            }

            // Usuwamy obserwację
            followedRecipeRepository.deleteByUserAndRecipe(user, recipe);
            log.info("Usunięto przepis {} z obserwowanych dla użytkownika {}", recipeId, user.getId());
        }
    }

    /**
     * Pobiera śledzone przepisy dla określonego użytkownika na podstawie jego ID
     */
    @Transactional(readOnly = true)
    public Page<FollowedRecipeResponseDTO> getUserFollowedRecipesByUserId(Long userId, Pageable pageable) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Użytkownik nie znaleziony"));

        return followedRecipeRepository.findByUser(user, pageable)
                .map(this::mapToDTO);
    }

    /**
     * Metoda pomocnicza do obsługi operacji dla zalogowanych i niezalogowanych użytkowników
     */
    private AppUser getUserForOperations(String userEmail) {
        if (userEmail == null || userEmail.isEmpty()) {
            // Dla niezalogowanego użytkownika używamy domyślnego konta gościa
            return userRepository.findByEmail(GUEST_EMAIL)
                    .orElseGet(this::createGuestUser);
        }

        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Użytkownik nie znaleziony: " + userEmail));
    }

    /**
     * Tworzy domyślne konto gościa jeśli nie istnieje
     */
    private AppUser createGuestUser() {
        AppUser guestUser = AppUser.builder()
                .email(GUEST_EMAIL)
                .firstName("Gość")
                .lastName("Aplikacji")
                .password("$2a$10$dummyhashedpassword") // Zahaszowane hasło (niedostępne)
                .role(Role.USER)
                .build();

        return userRepository.save(guestUser);
    }

    private FollowedRecipeResponseDTO mapToDTO(FollowedRecipe followedRecipe) {
        return new FollowedRecipeResponseDTO(
                followedRecipe.getId(),
                followedRecipe.getUser().getId(),
                followedRecipe.getRecipe().getId(),
                followedRecipe.getRecipe().getTitle(),
                followedRecipe.getFollowedAt()
        );
    }
}
