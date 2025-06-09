package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.RecipeImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface RecipeImageRepository extends JpaRepository<RecipeImage, Long> {
}
