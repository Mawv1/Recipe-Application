package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByAuthorId(Long authorId);
    List<Recipe> findByCategoryId(Long categoryId);
    List<Recipe> findByTitleContainingIgnoreCase(String title);
    List<Recipe> findByRateGreaterThanEqual(Float minRate);
    List<Recipe> findByAuthorIdOrderByDateOfCreationDesc(Long authorId);

    @Query("SELECT r FROM Recipe r WHERE r.rate >= :minRate AND r.category.id = :categoryId")
    List<Recipe> findByRateAndCategory(@Param("minRate") Float minRate, @Param("categoryId") Long categoryId);
}
