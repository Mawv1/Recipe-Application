package org.example.recipeapplication.service;

import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.RatingRequestDTO;
import org.example.recipeapplication.dto.RatingResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.Rating;
import org.example.recipeapplication.model.Recipe;
import org.example.recipeapplication.repos.RatingRepository;
import org.example.recipeapplication.repos.RecipeRepository;
import org.example.recipeapplication.repos.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RatingService {
    private final RatingRepository ratingRepository;
    private final AppUserRepository userRepository;
    private final RecipeRepository recipeRepository;

    @Transactional
    public RatingResponseDTO rateRecipe(Long recipeId, String userEmail, RatingRequestDTO ratingRequestDTO) {
        AppUser user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Użytkownik nie znaleziony"));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Przepis nie znaleziony"));

        Optional<Rating> existingRating = ratingRepository.findByUserAndRecipe(user, recipe);

        Rating rating;
        if (existingRating.isPresent()) {
            rating = existingRating.get();
            rating.setValue(ratingRequestDTO.getValue());
            rating.setUpdatedAt(LocalDateTime.now());
        } else {
            rating = new Rating();
            rating.setUser(user);
            rating.setRecipe(recipe);
            rating.setValue(ratingRequestDTO.getValue());
        }

        Rating savedRating = ratingRepository.save(rating);

        // Aktualizacja średniej oceny przepisu
        updateRecipeAverageRating(recipeId);

        return mapToDTO(savedRating);
    }

    @Transactional(readOnly = true)
    public RatingResponseDTO getUserRatingForRecipe(Long recipeId, String userEmail) {
        AppUser user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Użytkownik nie znaleziony"));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Przepis nie znaleziony"));

        return ratingRepository.findByUserAndRecipe(user, recipe)
                .map(this::mapToDTO)
                .orElse(null);
    }

    @Transactional
    public void deleteRating(Long recipeId, String userEmail) {
        AppUser user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Użytkownik nie znaleziony"));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Przepis nie znaleziony"));

        ratingRepository.deleteByUserAndRecipe(user, recipe);

        // Aktualizacja średniej oceny przepisu
        updateRecipeAverageRating(recipeId);
    }

    private void updateRecipeAverageRating(Long recipeId) {
        Double averageRating = ratingRepository.calculateAverageRating(recipeId);
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new EntityNotFoundException("Przepis nie znaleziony"));

        // Pobierz liczbę ocen dla przepisu
        int ratingCount = ratingRepository.findByRecipeId(recipeId).size();

        // Aktualizuj rating i licznik ocen
        if (averageRating != null) {
            recipe.setRating(averageRating.floatValue());
            recipe.setRatingCount(ratingCount);
        } else {
            recipe.setRating(null);
            recipe.setRatingCount(0);
        }

        recipeRepository.save(recipe);
    }

    private RatingResponseDTO mapToDTO(Rating rating) {
        RatingResponseDTO dto = new RatingResponseDTO();
        dto.setId(rating.getId());
        dto.setUserId(rating.getUser().getId());
        dto.setRecipeId(rating.getRecipe().getId());
        dto.setValue(rating.getValue());
        dto.setCreatedAt(rating.getCreatedAt());
        dto.setUpdatedAt(rating.getUpdatedAt());
        return dto;
    }
}
