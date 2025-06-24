package org.example.recipeapplication.repos;

import org.example.recipeapplication.model.CommentReaction;
import org.example.recipeapplication.model.CommentReaction.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {

    // Sprawdzenie czy użytkownik już zareagował na komentarz
    Optional<CommentReaction> findByUserIdAndCommentId(Long userId, Long commentId);

    // Wyszukiwanie wszystkich reakcji na dany komentarz
    List<CommentReaction> findByCommentId(Long commentId);

    // Zliczanie pozytywnych reakcji (like) dla komentarza
    @Query("SELECT COUNT(cr) FROM CommentReaction cr WHERE cr.comment.id = :commentId AND cr.reactionType = org.example.recipeapplication.model.CommentReaction.ReactionType.LIKE")
    int countLikesForComment(@Param("commentId") Long commentId);

    // Zliczanie negatywnych reakcji (dislike) dla komentarza
    @Query("SELECT COUNT(cr) FROM CommentReaction cr WHERE cr.comment.id = :commentId AND cr.reactionType = org.example.recipeapplication.model.CommentReaction.ReactionType.DISLIKE")
    int countDislikesForComment(@Param("commentId") Long commentId);

    // Usuwanie reakcji użytkownika na komentarz
    void deleteByUserIdAndCommentId(Long userId, Long commentId);
}
