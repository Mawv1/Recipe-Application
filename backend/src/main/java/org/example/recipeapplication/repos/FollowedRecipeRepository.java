package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.FollowedRecipe;
import org.example.recipeapplication.model.Recipe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowedRecipeRepository extends JpaRepository<FollowedRecipe, Long> {
    Page<FollowedRecipe> findByUser(AppUser user, Pageable pageable);
    List<FollowedRecipe> findByUser(AppUser user);
    Optional<FollowedRecipe> findByUserAndRecipe(AppUser user, Recipe recipe);
    boolean existsByUserAndRecipe(AppUser user, Recipe recipe);
    void deleteByUserAndRecipe(AppUser user, Recipe recipe);
}
