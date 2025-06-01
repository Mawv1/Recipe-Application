package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.RecipeCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface RecipeCategoryRepository extends JpaRepository<RecipeCategory, Long> {
}
