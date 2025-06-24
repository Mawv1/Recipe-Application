package org.example.recipeapplication.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.config.LogoutService;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.model.Token;
import org.example.recipeapplication.repos.TokenRepository;
import org.example.recipeapplication.service.UserAdminService;
import org.example.recipeapplication.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMIN')")  // Tylko administratorzy mają dostęp do tego kontrolera
public class AdminUserController {

    private final UserAdminService userAdminService;
    private final LogoutService logoutService;

    /**
     * Endpoint do blokowania użytkownika i wylogowania go z systemu
     */
    @PutMapping("/{userId}/ban")
    public ResponseEntity<?> banUser(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason) {

        // Zablokuj użytkownika
        UserResponseDTO bannedUser = userAdminService.banUser(userId, reason);

        // Wyloguj użytkownika ze wszystkich sesji
        int revokedTokensCount = logoutService.revokeAllUserTokens(userId);

        return ResponseEntity.ok(Map.of(
            "user", bannedUser,
            "revokedSessions", revokedTokensCount,
            "message", "Użytkownik został zablokowany i wylogowany ze wszystkich sesji"
        ));
    }

    /**
     * Endpoint do odblokowania użytkownika
     */
    @PutMapping("/{userId}/unban")
    public ResponseEntity<UserResponseDTO> unbanUser(@PathVariable Long userId) {
        UserResponseDTO unbannedUser = userAdminService.unbanUser(userId);
        return ResponseEntity.ok(unbannedUser);
    }

    /**
     * Sprawdza status blokady użytkownika
     */
    @GetMapping("/{userId}/ban-status")
    public ResponseEntity<Boolean> checkBanStatus(@PathVariable Long userId) {
        boolean isBanned = userAdminService.isUserBanned(userId);
        return ResponseEntity.ok(isBanned);
    }
}
