package org.example.recipeapplication.controller;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.CommentRequestDTO;
import org.example.recipeapplication.dto.CommentResponseDTO;
import org.example.recipeapplication.model.Comment;
import org.example.recipeapplication.service.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponseDTO addComment(@RequestBody CommentRequestDTO commentRequestDTO) {
        return commentService.addComment(commentRequestDTO);
    }

    @GetMapping("/recipe/{recipeId}")
    public List<CommentResponseDTO> getRecipeComments(@PathVariable Long recipeId) {
        return commentService.getRecipeComments(recipeId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
    }
}

