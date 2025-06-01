package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.FollowedRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface FollowedRecipeRepository extends JpaRepository<FollowedRecipe, Long> {
}
