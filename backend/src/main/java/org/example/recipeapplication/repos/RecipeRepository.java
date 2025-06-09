package org.example.recipeapplication.repos;

import org.example.recipeapplication.dto.RecipeResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.Category;
import org.example.recipeapplication.model.Recipe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByCategory_Id(Long categoryId);
    List<Recipe> findByCategory_NameContaining(String categoryName);
    List<Recipe> findByTags_NameContaining(String name);

    Page<Recipe> findByTitleContainingIgnoreCase(String search, Pageable pageable);

    Page<Recipe> findByCategory(Category category, Pageable pageable);

    Page<Recipe> findByAuthor(AppUser user, Pageable pageable);
}

