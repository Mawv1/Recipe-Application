package org.example.recipeapplication.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.repos.TokenRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LogoutService implements LogoutHandler {

    private final TokenRepository tokenRepository;

    @Override
    public void logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        if (authHeader == null ||!authHeader.startsWith("Bearer ")) {
            return;
        }
        jwt = authHeader.substring("Bearer ".length());
        var storedToken = tokenRepository.findByToken(jwt)
                .orElse(null);
        if (storedToken != null) {
            storedToken.setExpired(true);
            storedToken.setRevoked(true);
            tokenRepository.save(storedToken);
            SecurityContextHolder.clearContext();
        }
    }

    /**
     * Unieważnia wszystkie aktywne tokeny użytkownika o podanym ID.
     * Użycie tego powoduje wylogowanie użytkownika ze wszystkich sesji.
     *
     * @param userId ID użytkownika
     * @return Liczba unieważnionych tokenów
     */
    public int revokeAllUserTokens(Long userId) {
        var validUserTokens = tokenRepository.findAllValidTokenByUser(userId);
        if (validUserTokens.isEmpty()) {
            return 0;
        }

        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });

        tokenRepository.saveAll(validUserTokens);
        SecurityContextHolder.clearContext();
        return validUserTokens.size();
    }
}
