//package org.example.recipeapplication.controller;
//
//import lombok.RequiredArgsConstructor;
//import org.example.recipeapplication.dto.FollowedRecipeResponseDTO;
//import org.example.recipeapplication.service.FollowedRecipeService;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.domain.Sort;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.annotation.AuthenticationPrincipal;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Map;
//
///**
// * @deprecated Ta klasa została zastąpiona przez UserController.
// * Wszystkie endpointy związane ze śledzonymi przepisami zostały przeniesione do UserController.
// */
//@Deprecated
//// Usunięto adnotację @RestController, aby wyłączyć kontroler i uniknąć konfliktu mapowania
//@RequestMapping("/api/v1")
//@RequiredArgsConstructor
//public class FollowedRecipeController {
//
//    private final FollowedRecipeService followedRecipeService;
//
//    @PostMapping("/recipes/{recipeId}/follow")
//    public ResponseEntity<FollowedRecipeResponseDTO> followRecipe(
//            @PathVariable Long recipeId,
//            @AuthenticationPrincipal UserDetails userDetails
//    ) {
//        FollowedRecipeResponseDTO followed = followedRecipeService.followRecipe(recipeId, userDetails != null ? userDetails.getUsername() : null);
//        return ResponseEntity.status(HttpStatus.CREATED).body(followed);
//    }
//
//    @DeleteMapping("/recipes/{recipeId}/follow")
//    public ResponseEntity<Void> unfollowRecipe(
//            @PathVariable Long recipeId,
//            @AuthenticationPrincipal UserDetails userDetails
//    ) {
//        followedRecipeService.unfollowRecipe(recipeId, userDetails != null ? userDetails.getUsername() : null);
//        return ResponseEntity.noContent().build();
//    }
//
//    @GetMapping("/recipes/{recipeId}/follow/status")
//    public ResponseEntity<Map<String, Boolean>> checkFollowStatus(
//            @PathVariable Long recipeId,
//            @AuthenticationPrincipal UserDetails userDetails
//    ) {
//        boolean isFollowed = userDetails != null && followedRecipeService.isRecipeFollowed(recipeId, userDetails.getUsername());
//        return ResponseEntity.ok(Map.of("followed", isFollowed));
//    }
//
//    // Endpoint dostępny również dla niezalogowanych użytkowników (używa konta go��cia)
//    @GetMapping("/users/me/followed-recipes")
//    public ResponseEntity<Page<FollowedRecipeResponseDTO>> getMyFollowedRecipes(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size,
//            @RequestParam(defaultValue = "followedAt") String sortBy,
//            @RequestParam(defaultValue = "desc") String direction,
//            @AuthenticationPrincipal UserDetails userDetails
//    ) {
//        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
//        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
//        return ResponseEntity.ok(followedRecipeService.getFollowedRecipes(userDetails != null ? userDetails.getUsername() : null, pageable));
//    }
//}
