package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.MealCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface MealCategoryRepository extends JpaRepository<MealCategory, Long> {
}
