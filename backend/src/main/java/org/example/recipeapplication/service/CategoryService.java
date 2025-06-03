package org.example.recipeapplication.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.CategoryRequestDTO;
import org.example.recipeapplication.dto.CategoryResponseDTO;
import org.example.recipeapplication.model.Category;
import org.example.recipeapplication.repos.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public Category save(CategoryRequestDTO dto) {
        Category category = new Category();
        category.setName(dto.name());
        return categoryRepository.save(category);
    }

    public CategoryResponseDTO getById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        return new CategoryResponseDTO(category.getId(), category.getName());
    }

    public List<CategoryResponseDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    public CategoryResponseDTO addCategory(CategoryRequestDTO dto) {
        Category category = new Category();
        category.setName(dto.name());
        Category saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    public Category getEntityById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
    }

    private CategoryResponseDTO mapToDTO(Category category) {
        return new CategoryResponseDTO(category.getId(), category.getName());
    }
}

