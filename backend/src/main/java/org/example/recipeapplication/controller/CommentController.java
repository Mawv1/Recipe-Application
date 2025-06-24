package org.example.recipeapplication.controller;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.CommentRequestDTO;
import org.example.recipeapplication.dto.CommentResponseDTO;
import org.example.recipeapplication.model.Comment;
import org.example.recipeapplication.service.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @GetMapping("/recipe/{recipeId}")
    public List<CommentResponseDTO> getRecipeComments(@PathVariable Long recipeId) {
        return commentService.getRecipeComments(recipeId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentResponseDTO> getCommentById(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getCommentById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean deleted = commentService.deleteCommentWithAuthorization(id, userDetails.getUsername());

        if (deleted) {
            return ResponseEntity.noContent().build(); // 204 No Content
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 403 Forbidden
        }
    }

    @PostMapping("/{commentId}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponseDTO> addLike(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponseDTO updatedComment = commentService.addLike(commentId, userDetails.getUsername());
        return ResponseEntity.ok(updatedComment);
    }

    @DeleteMapping("/{commentId}/reaction")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponseDTO> removeReaction(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponseDTO updatedComment = commentService.removeReaction(commentId, userDetails.getUsername());
        return ResponseEntity.ok(updatedComment);
    }

    @PostMapping("/{commentId}/dislike")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponseDTO> addDislike(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponseDTO updatedComment = commentService.addDislike(commentId, userDetails.getUsername());
        return ResponseEntity.ok(updatedComment);
    }

    @GetMapping("/{commentId}/user-reaction")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> getUserReaction(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean hasLiked = commentService.hasUserLikedComment(commentId, userDetails.getUsername());
        boolean hasDisliked = commentService.hasUserDislikedComment(commentId, userDetails.getUsername());

        Map<String, Boolean> reaction = new HashMap<>();
        reaction.put("liked", hasLiked);
        reaction.put("disliked", hasDisliked);

        return ResponseEntity.ok(reaction);
    }

    @GetMapping("/{commentId}/liked")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Boolean> isCommentLikedByUser(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isLiked = commentService.hasUserLikedComment(commentId, userDetails.getUsername());
        return ResponseEntity.ok(isLiked);
    }

    @GetMapping("/{commentId}/disliked")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Boolean> isCommentDislikedByUser(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isDisliked = commentService.hasUserDislikedComment(commentId, userDetails.getUsername());
        return ResponseEntity.ok(isDisliked);
    }
}
