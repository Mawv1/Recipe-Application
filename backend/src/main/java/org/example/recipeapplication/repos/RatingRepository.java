package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.Rating;
import org.example.recipeapplication.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserAndRecipe(AppUser user, Recipe recipe);
    List<Rating> findByRecipeId(Long recipeId);

    @Query("SELECT AVG(r.value) FROM Rating r WHERE r.recipe.id = :recipeId")
    Double calculateAverageRating(Long recipeId);

    void deleteByUserAndRecipe(AppUser user, Recipe recipe);

    // Usuwa wszystkie oceny dla danego przepisu
    void deleteByRecipeId(Long recipeId);
}
