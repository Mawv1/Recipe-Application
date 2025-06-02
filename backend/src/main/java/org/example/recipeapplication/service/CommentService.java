package org.example.recipeapplication.service;

import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.model.Comment;
import org.example.recipeapplication.repos.CommentRepository;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;

    public Comment addComment(Comment comment) {
        comment.setDateOfCreation(new Timestamp(System.currentTimeMillis()));
        return commentRepository.save(comment);
    }

    public List<Comment> getRecipeComments(Long recipeId) {
        return commentRepository.findByRecipeIdOrderByDateOfCreationDesc(recipeId);
    }

    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }
}
