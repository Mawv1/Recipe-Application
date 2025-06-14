package org.example.recipeapplication.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.RatingRequestDTO;
import org.example.recipeapplication.dto.RatingResponseDTO;
import org.example.recipeapplication.service.RatingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/recipes")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    /**
     * Dodaje nową ocenę przepisu lub aktualizuje istniejącą.
     * Można użyć zarówno parametru URL jak i ciała żądania.
     */
    @PostMapping("/{recipeId}/rate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RatingResponseDTO> addOrUpdateRating(
            @PathVariable Long recipeId,
            @RequestParam(required = false) Integer value,
            @Valid @RequestBody(required = false) RatingRequestDTO ratingRequestDTO,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Tworzenie obiektu DTO jeśli otrzymaliśmy tylko parametr URL
        if (ratingRequestDTO == null && value != null) {
            ratingRequestDTO = new RatingRequestDTO(value);
        } else if (ratingRequestDTO == null) {
            return ResponseEntity.badRequest().body(null);
        }

        RatingResponseDTO ratingResponse = ratingService.rateRecipe(recipeId, userDetails.getUsername(), ratingRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ratingResponse);
    }

    /**
     * Aktualizuje istniejącą ocenę przepisu.
     * Używa HTTP PUT zgodnie z konwencją REST.
     */
    @PutMapping("/{recipeId}/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RatingResponseDTO> updateRating(
            @PathVariable Long recipeId,
            @RequestParam(required = false) Integer value,
            @Valid @RequestBody(required = false) RatingRequestDTO ratingRequestDTO,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Tworzenie obiektu DTO jeśli otrzymaliśmy tylko parametr URL
        if (ratingRequestDTO == null && value != null) {
            ratingRequestDTO = new RatingRequestDTO(value);
        } else if (ratingRequestDTO == null) {
            return ResponseEntity.badRequest().body(null);
        }

        // Sprawdzamy czy użytkownik ma już ocenę dla tego przepisu
        RatingResponseDTO existingRating = ratingService.getUserRatingForRecipe(recipeId, userDetails.getUsername());
        if (existingRating == null) {
            return ResponseEntity.notFound().build();
        }

        RatingResponseDTO ratingResponse = ratingService.rateRecipe(recipeId, userDetails.getUsername(), ratingRequestDTO);
        return ResponseEntity.ok(ratingResponse);
    }

    /**
     * Pobiera ocenę przepisu wystawioną przez zalogowanego użytkownika.
     */
    @GetMapping("/{recipeId}/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RatingResponseDTO> getUserRating(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RatingResponseDTO ratingResponse = ratingService.getUserRatingForRecipe(recipeId, userDetails.getUsername());
        if (ratingResponse == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(ratingResponse);
    }

    /**
     * Usuwa ocenę przepisu wystawioną przez zalogowanego użytkownika.
     */
    @DeleteMapping("/{recipeId}/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteRating(
            @PathVariable Long recipeId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ratingService.deleteRating(recipeId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
