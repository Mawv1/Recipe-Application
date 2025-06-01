package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.RecipeTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface RecipeTagRepository extends JpaRepository<RecipeTag, Long> {
}
