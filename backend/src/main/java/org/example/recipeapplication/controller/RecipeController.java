package org.example.recipeapplication.controller;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.RecipeRequestDTO;
import org.example.recipeapplication.dto.RecipeResponseDTO;
import org.example.recipeapplication.model.Recipe;
import org.example.recipeapplication.service.RecipeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recipes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class RecipeController {
    private final RecipeService recipeService;

    @GetMapping
    public ResponseEntity<Page<RecipeResponseDTO>> getAllRecipes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
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

    @PostMapping("/add")
    public ResponseEntity<RecipeResponseDTO> addRecipe(@RequestBody RecipeRequestDTO recipeRequestDTO) {
        RecipeResponseDTO createdRecipe = recipeService.addRecipe(recipeRequestDTO);
        return new ResponseEntity<>(createdRecipe, HttpStatus.CREATED);
    }
}

