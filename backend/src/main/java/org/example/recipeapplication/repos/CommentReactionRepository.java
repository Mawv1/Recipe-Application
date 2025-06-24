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

    // Zliczanie reakcji dla komentarza według typu
    @Query("SELECT COUNT(cr) FROM CommentReaction cr WHERE cr.comment.id = :commentId AND cr.reactionType = :reactionType")
    int countReactionsForCommentByType(@Param("commentId") Long commentId, @Param("reactionType") ReactionType reactionType);

    // Metoda pomocnicza do zliczania like'ów
    default int countLikesForComment(Long commentId) {
        return countReactionsForCommentByType(commentId, ReactionType.LIKE);
    }

    // Metoda pomocnicza do zliczania dislike'ów
    default int countDislikesForComment(Long commentId) {
        return countReactionsForCommentByType(commentId, ReactionType.DISLIKE);
    }

    // Usuwanie reakcji użytkownika na komentarz
    void deleteByUserIdAndCommentId(Long userId, Long commentId);
}
