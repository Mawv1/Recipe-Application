package org.example.recipeapplication.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Przepisy", description = "Operacje związane z przepisami kulinarnymi")
public class RecipeController {
    private final RecipeService recipeService;
    private final CommentService commentService;

    @GetMapping
    @Operation(summary = "Pobierz wszystkie przepisy",
              description = "Zwraca stronę przepisów z możliwością sortowania i paginacji")
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
    @Operation(summary = "Wyszukaj przepisy",
              description = "Wyszukuje przepisy zawierające podaną frazę w nazwie lub opisie")
    public ResponseEntity<Page<RecipeResponseDTO>> searchRecipes(
            @RequestParam String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(recipeService.searchRecipes(search, pageable));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Pobierz przepisy z kategorii",
              description = "Zwraca przepisy należące do określonej kategorii")
    public ResponseEntity<Page<RecipeResponseDTO>> getRecipesByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(recipeService.getRecipesByCategory(categoryId, pageable));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Pobierz przepisy użytkownika",
              description = "Zwraca przepisy utworzone przez określonego użytkownika")
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
    @Operation(summary = "Dodaj przepis z obrazem",
              description = "Tworzy nowy przepis z możliwością załączenia obrazu. Wymaga uwierzytelnienia.")
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
    @Operation(summary = "Dodaj przepis",
              description = "Tworzy nowy przepis bez załączników. Wymaga uwierzytelnienia.")
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
    @Operation(summary = "Pobierz przepis według ID",
              description = "Zwraca szczegóły przepisu o podanym identyfikatorze")
    public ResponseEntity<RecipeResponseDTO> getRecipeById(@PathVariable Long id) {
        return recipeService.getRecipeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Usuń przepis",
              description = "Usuwa przepis o podanym ID. Wymaga uwierzytelnienia - tylko autor przepisu lub administrator może go usunąć.")
    public ResponseEntity<Void> deleteRecipe(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        recipeService.deleteRecipe(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Dodaj/zamień obraz przepisu",
              description = "Dodaje lub aktualizuje obraz przepisu. Wymaga uwierzytelnienia.")
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
    @Operation(summary = "Pobierz oczekujące przepisy",
              description = "Zwraca listę przepisów oczekujących na zatwierdzenie. Wymaga uprawnień administratora.")
    public ResponseEntity<Page<RecipeResponseDTO>> getPendingRecipes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(recipeService.getPendingRecipes(pageable));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Zmień status przepisu",
              description = "Zmienia status przepisu (np. zaakceptowany, odrzucony). Wymaga uprawnień administratora.")
    public ResponseEntity<RecipeResponseDTO> changeRecipeStatus(
            @PathVariable Long id,
            @RequestParam("status") String status
    ) {
        RecipeResponseDTO updated = recipeService.changeRecipeStatus(id, org.example.recipeapplication.model.RecipeStatus.valueOf(status));
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/my-recipes")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Pobierz moje przepisy",
              description = "Zwraca przepisy utworzone przez zalogowanego użytkownika. Wymaga uwierzytelnienia.")
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
    @Operation(summary = "Aktualizuj przepis",
              description = "Aktualizuje istniejący przepis. Wymaga uwierzytelnienia - tylko autor przepisu może go edytować.")
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
    @Operation(summary = "Pobierz komentarze przepisu",
              description = "Zwraca listę komentarzy do określonego przepisu z paginacją")
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
    @Operation(summary = "Dodaj komentarz do przepisu",
              description = "Dodaje nowy komentarz do przepisu. Wymaga uwierzytelnienia.")
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
    @Operation(summary = "Usuń komentarz przepisu",
              description = "Usuwa komentarz o podanym ID. Wymaga uwierzytelnienia.")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}

