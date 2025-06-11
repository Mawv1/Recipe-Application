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

    @PostMapping("/{recipeId}/rate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RatingResponseDTO> rateRecipe(
            @PathVariable Long recipeId,
            @Valid @RequestBody RatingRequestDTO ratingRequestDTO,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RatingResponseDTO ratingResponse = ratingService.rateRecipe(recipeId, userDetails.getUsername(), ratingRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ratingResponse);
    }

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
