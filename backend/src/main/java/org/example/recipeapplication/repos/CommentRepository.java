package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByRecipeId(Long recipeId);
    List<Comment> findByAuthorId(Long authorId);
    List<Comment> findByRecipeIdOrderByDateOfCreationDesc(Long recipeId);
}
