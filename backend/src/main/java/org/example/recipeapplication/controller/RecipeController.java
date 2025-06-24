package org.example.recipeapplication.controller;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.CommentRequestDTO;
import org.example.recipeapplication.dto.CommentResponseDTO;
import org.example.recipeapplication.dto.RecipeRequestDTO;
import org.example.recipeapplication.dto.RecipeResponseDTO;
import org.example.recipeapplication.service.CommentService;
import org.example.recipeapplication.service.RecipeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/recipes")
@RequiredArgsConstructor
public class RecipeController {
    private final RecipeService recipeService;
    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<Page<RecipeResponseDTO>> getAllRecipes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "dateOfCreation") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        return ResponseEntity.ok(recipeService.getAllRecipes(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<RecipeResponseDTO>> searchRecipes(
            @RequestParam String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(recipeService.searchRecipes(search, pageable));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<RecipeResponseDTO>> getRecipesByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(recipeService.getRecipesByCategory(categoryId, pageable));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<RecipeResponseDTO>> getUserRecipes(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(recipeService.getUserRecipes(userId, pageable));
    }

    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RecipeResponseDTO> addRecipeWithImage(
            @RequestPart("recipe") RecipeRequestDTO recipeRequestDTO,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RecipeResponseDTO createdRecipe = recipeService.addRecipeWithImage(recipeRequestDTO, imageFile, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRecipe);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RecipeResponseDTO> addRecipe(
            @Valid @RequestBody RecipeRequestDTO recipeRequestDTO,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        RecipeResponseDTO createdRecipe = recipeService.addRecipe(recipeRequestDTO, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRecipe);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeResponseDTO> getRecipeById(@PathVariable Long id) {
        return recipeService.getRecipeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteRecipe(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        recipeService.deleteRecipe(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RecipeResponseDTO> uploadRecipeImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile imageFile,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RecipeResponseDTO updatedRecipe = recipeService.updateRecipeImage(id, imageFile, userDetails.getUsername());
        return ResponseEntity.ok(updatedRecipe);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<Page<RecipeResponseDTO>> getPendingRecipes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(recipeService.getPendingRecipes(pageable));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RecipeResponseDTO> changeRecipeStatus(
            @PathVariable Long id,
            @RequestParam("status") String status
    ) {
        RecipeResponseDTO updated = recipeService.changeRecipeStatus(id, org.example.recipeapplication.model.RecipeStatus.valueOf(status));
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/my-recipes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<RecipeResponseDTO>> getMyRecipes(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(recipeService.getMyRecipes(userDetails.getUsername(), pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RecipeResponseDTO> updateRecipe(
            @PathVariable Long id,
            @Valid @RequestBody RecipeRequestDTO recipeRequestDTO,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            RecipeResponseDTO updatedRecipe = recipeService.updateRecipe(id, recipeRequestDTO, userDetails.getUsername());
            return ResponseEntity.ok(updatedRecipe);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<Map<String, Object>> getRecipeComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Map<String, Object> commentsData = recipeService.getRecipeComments(id, pageable);
        return ResponseEntity.ok(commentsData);
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponseDTO> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequestDTO commentRequestDTO,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Ustawienie recipeId z parametru ścieżki URL zamiast polegania na JSON
        CommentResponseDTO savedComment = commentService.addComment(
            new CommentRequestDTO(
                commentRequestDTO.content(),
                commentRequestDTO.likesCount(),
                commentRequestDTO.dislikesCount(),
                id  // używamy id z URL zamiast z requestDTO
            ),
            userDetails.getUsername()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(savedComment);
    }

    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
