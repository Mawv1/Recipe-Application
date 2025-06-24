package org.example.recipeapplication.repos;

import org.example.recipeapplication.dto.RecipeResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.Category;
import org.example.recipeapplication.model.Recipe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByCategory_Id(Long categoryId);
    List<Recipe> findByCategory_NameContaining(String categoryName);

    // Poprawiona metoda dla wyszukiwania po tagach
    @Query("SELECT r FROM Recipe r JOIN r.tags t WHERE t LIKE %:tag%")
    List<Recipe> findByTagsContaining(@Param("tag") String tag);

    Page<Recipe> findByTitleContainingIgnoreCase(String search, Pageable pageable);

    /**
     * Wyszukuje przepisy, które zawierają podaną frazę w tytule, opisie lub tagach
     */
    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN r.tags t WHERE " +
           "LOWER(r.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(t) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Recipe> searchByTitleOrDescriptionOrTags(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Wyszukuje przepisy, które zawierają podaną frazę w tytule lub opisie
     */
    @Query("SELECT r FROM Recipe r WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Recipe> searchByTitleOrDescription(@Param("searchTerm") String searchTerm, Pageable pageable);

    Page<Recipe> findByCategory(Category category, Pageable pageable);

    Page<Recipe> findByAuthor(AppUser user, Pageable pageable);

    Page<Recipe> findByAuthor_Email(String email, Pageable pageable);

    Page<Recipe> findByStatus(org.example.recipeapplication.model.RecipeStatus status, Pageable pageable);
}
