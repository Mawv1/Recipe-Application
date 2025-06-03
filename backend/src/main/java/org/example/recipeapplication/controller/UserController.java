package org.example.recipeapplication.controller;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.UserRequestDTO;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.FollowedRecipe;
import org.example.recipeapplication.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PutMapping("/{id}")
    public UserResponseDTO updateProfile(@PathVariable Long id, @RequestBody UserRequestDTO userRequestDTO) {
        return userService.updateUserProfile(id, userRequestDTO);
    }

    @GetMapping("/{userId}/followed-recipes")
    public List<FollowedRecipe> getUserFollowedRecipes(@PathVariable Long userId) {
        return userService.getUserFollowedRecipes(userId);
    }
}

