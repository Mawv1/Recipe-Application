package org.example.recipeapplication.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.CommentRequestDTO;
import org.example.recipeapplication.dto.CommentResponseDTO;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.Comment;
import org.example.recipeapplication.model.CommentReaction;
import org.example.recipeapplication.model.Recipe;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.repos.CommentReactionRepository;
import org.example.recipeapplication.repos.CommentRepository;
import org.example.recipeapplication.repos.RecipeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final RecipeRepository recipeRepository;
    private final AppUserRepository userRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final UserAdminService userAdminService; // Dodanie UserAdminService

    public CommentResponseDTO addComment(CommentRequestDTO dto, String userEmail) {
        Recipe recipe = recipeRepository.findById(dto.recipeId())
                .orElseThrow(() -> new EntityNotFoundException("Recipe not found"));

        // Znajdź użytkownika po emailu (zalogowanego użytkownika)
        AppUser author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + userEmail));

        // Sprawdź czy użytkownik nie jest zablokowany
        if (author.isBanned()) {
            throw new SecurityException("User is banned and cannot add comments. Reason: " +
                (author.getBanReason() != null ? author.getBanReason() : "Not specified"));
        }

        Comment comment = new Comment();
        comment.setRecipe(recipe);
        comment.setAuthor(author);
        comment.setContent(dto.content());
        comment.setLikesCount(0);       // Nowy komentarz zaczyna z 0 polubień
        comment.setDislikesCount(0);    // i 0 niepolubień
        comment.setDateOfCreation(new Timestamp(System.currentTimeMillis()));

        Comment saved = commentRepository.save(comment);
        return mapToDTO(saved);
    }

    public List<CommentResponseDTO> getRecipeComments(Long recipeId) {
        return commentRepository.findByRecipeId(recipeId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Pobiera komentarz po jego ID
     *
     * @param id ID komentarza do pobrania
     * @return DTO komentarza
     * @throws EntityNotFoundException jeśli komentarz nie istnieje
     */
    public CommentResponseDTO getCommentById(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + id));
        return mapToDTO(comment);
    }

    /**
     * Ta metoda będzie używana tylko wewnętrznie - nie powinna być dostępna przez API
     */
    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }

    /**
     * Usuwa komentarz tylko jeśli użytkownik ma do tego uprawnienia:
     * - jest autorem komentarza
     * - jest autorem przepisu, pod którym znajduje się komentarz
     * - jest administratorem
     *
     * @param commentId ID komentarza do usunięcia
     * @param userEmail email zalogowanego użytkownika
     * @return true jeśli komentarz został usunięty, false jeśli użytkownik nie ma uprawnień
     * @throws EntityNotFoundException jeśli komentarz nie istnieje
     */
    @Transactional
    public boolean deleteCommentWithAuthorization(Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));

        AppUser currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + userEmail));

        Recipe recipe = comment.getRecipe();

        // Sprawdzenie czy użytkownik jest administratorem
        boolean isAdmin = currentUser.getRole() != null && currentUser.getRole().toString().equals("ADMIN");

        // Sprawdzenie czy użytkownik jest autorem komentarza
        boolean isCommentAuthor = comment.getAuthor().getId().equals(currentUser.getId());

        // Sprawdzenie czy użytkownik jest autorem przepisu
        boolean isRecipeAuthor = recipe.getAuthor().getId().equals(currentUser.getId());

        if (isAdmin || isCommentAuthor || isRecipeAuthor) {
            // Najpierw usuwamy wszystkie reakcje związane z komentarzem
            commentReactionRepository.deleteAll(
                commentReactionRepository.findByCommentId(comment.getId())
            );

            // Teraz usuwamy sam komentarz
            commentRepository.deleteById(commentId);
            return true;
        }

        return false;
    }

    /**
     * Dodaje pozytywną reakcję (like) na komentarz.
     * Jeśli użytkownik już zareagował na ten komentarz, reakcja zostanie zaktualizowana.
     */
    @Transactional
    public CommentResponseDTO addLike(Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));

        AppUser user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + userEmail));

        // Sprawdzenie, czy użytkownik już zareagował na ten komentarz
        Optional<CommentReaction> existingReaction = commentReactionRepository.findByUserIdAndCommentId(user.getId(), commentId);

        if (existingReaction.isPresent()) {
            CommentReaction reaction = existingReaction.get();
            // Jeśli już istnieje reakcja tego samego typu, nie robimy nic
            if (reaction.getReactionType() == CommentReaction.ReactionType.LIKE) {
                return mapToDTO(comment);
            }

            // Jeśli była to negatywna reakcja, zmieniamy ją na pozytywną
            reaction.setReactionType(CommentReaction.ReactionType.LIKE);
            commentReactionRepository.save(reaction);
        } else {
            // Tworzenie nowej reakcji
            CommentReaction reaction = new CommentReaction();
            reaction.setUser(user);
            reaction.setComment(comment);
            reaction.setReactionType(CommentReaction.ReactionType.LIKE);
            commentReactionRepository.save(reaction);
        }

        // Aktualizacja liczników w komentarzu
        updateCommentReactionCounts(comment);

        return mapToDTO(comment);
    }

    /**
     * Dodaje negatywną reakcję (dislike) na komentarz.
     * Jeśli użytkownik już zareagował na ten komentarz, reakcja zostanie zaktualizowana.
     */
    @Transactional
    public CommentResponseDTO addDislike(Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));

        AppUser user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + userEmail));

        // Sprawdzenie, czy użytkownik już zareagował na ten komentarz
        Optional<CommentReaction> existingReaction = commentReactionRepository.findByUserIdAndCommentId(user.getId(), commentId);

        if (existingReaction.isPresent()) {
            CommentReaction reaction = existingReaction.get();
            // Jeśli już istnieje reakcja tego samego typu, nie robimy nic
            if (reaction.getReactionType() == CommentReaction.ReactionType.DISLIKE) {
                return mapToDTO(comment);
            }

            // Jeśli była to pozytywna reakcja, zmieniamy ją na negatywną
            reaction.setReactionType(CommentReaction.ReactionType.DISLIKE);
            commentReactionRepository.save(reaction);
        } else {
            // Tworzenie nowej reakcji
            CommentReaction reaction = new CommentReaction();
            reaction.setUser(user);
            reaction.setComment(comment);
            reaction.setReactionType(CommentReaction.ReactionType.DISLIKE);
            commentReactionRepository.save(reaction);
        }

        // Aktualizacja liczników w komentarzu
        updateCommentReactionCounts(comment);

        return mapToDTO(comment);
    }

    /**
     * Usuwa reakcję użytkownika (like lub dislike) na komentarz.
     */
    @Transactional
    public CommentResponseDTO removeReaction(Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));

        AppUser user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + userEmail));

        // Usunięcie reakcji, jeśli istnieje
        commentReactionRepository.deleteByUserIdAndCommentId(user.getId(), commentId);

        // Aktualizacja liczników w komentarzu
        updateCommentReactionCounts(comment);

        return mapToDTO(comment);
    }

    /**
     * Usuwa wszystkie reakcje dla danego komentarza
     *
     * @param commentId ID komentarza, dla którego mają zostać usunięte reakcje
     */
    @Transactional
    public void deleteAllReactionsForComment(Long commentId) {
        List<CommentReaction> reactions = commentReactionRepository.findByCommentId(commentId);
        if (!reactions.isEmpty()) {
            commentReactionRepository.deleteAll(reactions);
        }
    }

    /**
     * Aktualizacja liczników polubień i niepolubień w komentarzu na podstawie reakcji
     */
    private void updateCommentReactionCounts(Comment comment) {
        int likes = commentReactionRepository.countLikesForComment(comment.getId());
        int dislikes = commentReactionRepository.countDislikesForComment(comment.getId());

        comment.setLikesCount(likes);
        comment.setDislikesCount(dislikes);

        commentRepository.save(comment);
    }

    /**
     * Sprawdza, czy użytkownik polubił dany komentarz
     */
    public boolean hasUserLikedComment(Long commentId, String userEmail) {
        AppUser user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + userEmail));

        Optional<CommentReaction> reaction = commentReactionRepository.findByUserIdAndCommentId(user.getId(), commentId);
        return reaction.isPresent() && reaction.get().getReactionType() == CommentReaction.ReactionType.LIKE;
    }

    /**
     * Sprawdza, czy użytkownik nie lubi danego komentarza
     */
    public boolean hasUserDislikedComment(Long commentId, String userEmail) {
        AppUser user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + userEmail));

        Optional<CommentReaction> reaction = commentReactionRepository.findByUserIdAndCommentId(user.getId(), commentId);
        return reaction.isPresent() && reaction.get().getReactionType() == CommentReaction.ReactionType.DISLIKE;
    }

    private CommentResponseDTO mapToDTO(Comment comment) {
        return new CommentResponseDTO(
                comment.getId(),
                comment.getContent(),
                comment.getLikesCount(),
                comment.getDislikesCount(),
                new UserResponseDTO(
                        comment.getAuthor().getId(),
                        comment.getAuthor().getFirstName(),
                        comment.getAuthor().getLastName(),
                        comment.getAuthor().getProfilePicture(),
                        comment.getAuthor().getEmail(),
                        comment.getAuthor().getRole() != null ? comment.getAuthor().getRole().name() : null,
                        comment.getAuthor().isBanned(),
                        comment.getAuthor().getBanReason(),
                        null // nie pobieramy przepisów autora w komentarzu
                ),
                comment.getDateOfCreation().toLocalDateTime()
        );
    }
}
