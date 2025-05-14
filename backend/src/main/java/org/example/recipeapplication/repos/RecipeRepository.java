package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
}
