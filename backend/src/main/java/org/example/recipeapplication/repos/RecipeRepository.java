package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
}
