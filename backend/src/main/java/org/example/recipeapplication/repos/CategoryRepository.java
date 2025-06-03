package org.example.recipeapplication.repos;

import org.example.recipeapplication.dto.CategoryResponseDTO;
import org.example.recipeapplication.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}

