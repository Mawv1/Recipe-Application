package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
}
