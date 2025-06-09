package org.example.recipeapplication.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.config.JwtService;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.model.Role;
import org.example.recipeapplication.model.Token;
import org.example.recipeapplication.model.TokenType;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.repos.TokenRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AppUserRepository appUserRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        var user = AppUser.builder()
                .firstName(request.getFirstName())    // poprawne nazwy pól
                .lastName(request.getLastName())      // poprawne nazwy pól
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER) // Wymuszamy zawsze USER
                .build();
        var savedUser = appUserRepository.save(user);
        var accessToken = jwtService.generateToken(savedUser);
        var refreshToken = jwtService.generateRefreshToken(savedUser);

        saveUserToken(savedUser, accessToken, refreshToken);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = appUserRepository.findByEmail(request.getEmail())
                .orElseThrow();
        var accessToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, accessToken, refreshToken);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    private void saveUserToken(AppUser user, String accessToken, String refreshToken) {
        var accessTokenEntity = Token.builder()
                .user(user)
                .token(accessToken)
                .tokenType(TokenType.BEARER)
                .expired(false)
                .revoked(false)
                .build();
        var refreshTokenEntity = Token.builder()
                .user(user)
                .token(refreshToken)
                .tokenType(TokenType.REFRESH)
                .expired(false)
                .revoked(false)
                .build();
        tokenRepository.saveAll(Arrays.asList(accessTokenEntity, refreshTokenEntity));
    }

    private void revokeAllUserTokens(AppUser user) {
        var validUserTokens = tokenRepository.findAllValidTokenByUser(user.getId());
        if (validUserTokens.isEmpty())
            return;
        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validUserTokens);
    }

    public void refreshToken(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        final String refreshToken;
        final String userEmail;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }
        refreshToken = authHeader.substring(7);
        userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail != null) {
            var user = this.appUserRepository.findByEmail(userEmail)
                    .orElseThrow();
            if (jwtService.isTokenValid(refreshToken, user)) {
                var accessToken = jwtService.generateToken(user);
                revokeAllUserTokens(user);
                saveUserToken(user, accessToken, refreshToken);
                var authResponse = AuthenticationResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .build();
                new ObjectMapper().writeValue(response.getOutputStream(), authResponse);
            }
        }
    }
}

