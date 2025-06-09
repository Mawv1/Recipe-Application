package org.example.recipeapplication.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.CommentRequestDTO;
import org.example.recipeapplication.dto.CommentResponseDTO;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.Comment;
import org.example.recipeapplication.model.Recipe;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.repos.CommentRepository;
import org.example.recipeapplication.repos.RecipeRepository;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final RecipeRepository recipeRepository;
    private final AppUserRepository userRepository;

    public CommentResponseDTO addComment(CommentRequestDTO dto) {
        Recipe recipe = recipeRepository.findById(dto.recipeId())
                .orElseThrow(() -> new EntityNotFoundException("Recipe not found"));
        // Tu przyjmuję, że author to aktualny zalogowany user - dla uproszczenia pobieram pierwszego usera
        AppUser author = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Author not found"));

        Comment comment = new Comment();
        comment.setRecipe(recipe);
        comment.setAuthor(author);
        comment.setContent(dto.content());
        comment.setRate(dto.rate());
        comment.setDateOfCreation(new Timestamp(System.currentTimeMillis()));

        Comment saved = commentRepository.save(comment);
        return mapToDTO(saved);
    }

    public List<CommentResponseDTO> getRecipeComments(Long recipeId) {
        return commentRepository.findByRecipeId(recipeId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }

    private CommentResponseDTO mapToDTO(Comment comment) {
        return new CommentResponseDTO(
                comment.getId(),
                comment.getContent(),
                comment.getRate(),
                new UserResponseDTO(
                        comment.getAuthor().getId(),
                        comment.getAuthor().getFirstName(),
                        comment.getAuthor().getLastName(),
                        comment.getAuthor().getProfilePicture()
                ),
                comment.getDateOfCreation().toLocalDateTime()
        );
    }
}
