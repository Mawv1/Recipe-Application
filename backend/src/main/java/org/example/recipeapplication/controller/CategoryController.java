package org.example.recipeapplication.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.CategoryRequestDTO;
import org.example.recipeapplication.dto.CategoryResponseDTO;
import org.example.recipeapplication.model.Category;
import org.example.recipeapplication.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Kategorie", description = "Operacje związane z kategoriami przepisów")
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Pobierz wszystkie kategorie",
              description = "Zwraca listę wszystkich dostępnych kategorii przepisów")
    public List<CategoryResponseDTO> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Dodaj nową kategorię",
              description = "Tworzy nową kategorię przepisów. Wymaga uprawnień administratora.")
    public CategoryResponseDTO addCategory(@RequestBody CategoryRequestDTO categoryRequestDTO) {
        return categoryService.addCategory(categoryRequestDTO);
    }

    /**
     * Endpoint do usuwania kategorii po ID
     * @param id Identyfikator kategorii do usunięcia
     * @return Status 204 No Content, jeśli usunięcie się powiodło
     */
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Usuń kategorię",
              description = "Usuwa kategorię o podanym ID. Wymaga uprawnień administratora.")
    public void deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
    }
}

