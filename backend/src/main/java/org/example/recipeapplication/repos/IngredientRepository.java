package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
}
