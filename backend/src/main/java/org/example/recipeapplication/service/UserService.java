package org.example.recipeapplication.service;

import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.FollowedRecipe;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.repos.FollowedRecipeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final AppUserRepository userRepository;
    private final FollowedRecipeRepository followedRecipeRepository;

    public AppUser updateUserProfile(Long id, AppUser user) {
        return userRepository.findById(id)
                .map(existingUser -> {
                    existingUser.setFirstName(user.getFirstName());
                    existingUser.setLastName(user.getLastName());
                    existingUser.setProfilePicture(user.getProfilePicture());
                    return userRepository.save(existingUser);
                })
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<FollowedRecipe> getUserFollowedRecipes(Long userId) {
        return followedRecipeRepository.findByUsersId(userId);
    }
}
