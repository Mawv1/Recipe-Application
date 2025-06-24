package org.example.recipeapplication.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.IngredientRequestDTO;
import org.example.recipeapplication.dto.IngredientResponseDTO;
import org.example.recipeapplication.model.Ingredient;
import org.example.recipeapplication.service.IngredientService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ingredients")
@RequiredArgsConstructor
@Tag(name = "Składniki", description = "Operacje związane ze składnikami przepisów")
public class IngredientController {
    private final IngredientService ingredientService;

    @GetMapping("/search")
    @Operation(summary = "Wyszukaj składniki",
              description = "Wyszukuje składniki po nazwie lub jej fragmencie")
    public List<IngredientResponseDTO> searchIngredients(@RequestParam String name) {
        return ingredientService.searchIngredients(name);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Dodaj składnik",
              description = "Dodaje nowy składnik do bazy danych")
    public IngredientResponseDTO addIngredient(@RequestBody IngredientRequestDTO ingredientRequestDTO) {
        return ingredientService.addIngredient(ingredientRequestDTO);
    }
}

