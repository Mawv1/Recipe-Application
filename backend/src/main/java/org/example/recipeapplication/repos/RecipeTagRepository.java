package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.RecipeTag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeTagRepository extends JpaRepository<RecipeTag, Long> {
}
