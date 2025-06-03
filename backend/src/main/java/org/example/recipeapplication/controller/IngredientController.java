package org.example.recipeapplication.controller;

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
public class IngredientController {
    private final IngredientService ingredientService;

    @GetMapping("/search")
    public List<IngredientResponseDTO> searchIngredients(@RequestParam String name) {
        return ingredientService.searchIngredients(name);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IngredientResponseDTO addIngredient(@RequestBody IngredientRequestDTO ingredientRequestDTO) {
        return ingredientService.addIngredient(ingredientRequestDTO);
    }
}

