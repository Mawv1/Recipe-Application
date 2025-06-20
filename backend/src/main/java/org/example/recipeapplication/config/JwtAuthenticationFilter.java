package org.example.recipeapplication.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.example.recipeapplication.repos.TokenRepository;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final TokenRepository tokenRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        // Dodaj logowanie dla wszystkich żądań
        String path = request.getServletPath();
        String method = request.getMethod();
        System.out.println("\n[JwtFilter] Processing request: " + method + " " + path);

        // Pomijamy filtr dla endpointów autoryzacyjnych
        if (request.getServletPath().contains("/api/v1/auth")) {
            System.out.println("[JwtFilter] Skipping auth endpoint");
            filterChain.doFilter(request, response);
            return;
        }

        // Szczególne logowanie dla endpointu /api/v1/recipes/pending
        if (path.equals("/api/v1/recipes/pending")) {
            System.out.println("[JwtFilter] Processing /api/v1/recipes/pending endpoint");
        }

        // Pomijamy filtr dla publicznych endpointów tylko dla GET
        if ((path.equals("/api/v1/recipes") && method.equals("GET")) ||
            path.startsWith("/api/v1/recipes/search") ||
            path.startsWith("/api/v1/recipes/category/") ||
            path.startsWith("/api/v1/recipes/user/") ||
            (path.startsWith("/api/v1/recipes/") && method.equals("GET") && !path.equals("/api/v1/recipes/pending")) ||
            // Publiczne endpointy dla obserwowanych przepisów
            path.matches("/api/v1/users/\\d+/followed-recipes") ||
            path.startsWith("/api/v1/users/email/")) {
            System.out.println("[JwtFilter] Skipping public endpoint");
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;
        if (authHeader == null ||!authHeader.startsWith("Bearer ")) {
            System.out.println("[JwtFilter] No JWT token found in request");
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring("Bearer ".length());
        userEmail = jwtService.extractUsername(jwt);
        System.out.println("[JwtFilter] JWT token found, extracted email: " + userEmail);

        // Dodaj debugowanie dla /api/v1/recipes/pending
        if (path.equals("/api/v1/recipes/pending")) {
            System.out.println("[JwtFilter] DEBUG /pending - JWT Token: " + jwt);
            try {
                System.out.println("[JwtFilter] DEBUG /pending - JWT Claims: " + jwtService.extractAllClaims(jwt));
            } catch (Exception e) {
                System.out.println("[JwtFilter] Error extracting claims: " + e.getMessage());
            }
        }

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
            var isTokenValid = tokenRepository.findByToken(jwt)
                    .map(t -> !t.isExpired() && !t.isRevoked())
                    .orElse(false);
            if (jwtService.isTokenValid(jwt, userDetails) && isTokenValid) {
                // Pobierz rolę z tokena JWT
                String role = (String) jwtService.extractAllClaims(jwt).get("role");
                log.info("JWT AUTH: Extracted role from token: {}", role);
                Collection<? extends GrantedAuthority> authorities;
                if (role != null) {
                    // Zachowujemy oryginalną rolę z tokenu JWT i dodajemy również wersję z prefiksem ROLE_
                    // aby zapewnić kompatybilność z różnymi metodami sprawdzania uprawnień
                    if (role.startsWith("ROLE_")) {
                        authorities = List.of(new SimpleGrantedAuthority(role));
                        log.info("JWT AUTH: Role already has ROLE_ prefix: {}", role);
                    } else {
                        // Dodajemy dwie wersje uprawnienia - oryginalną i z prefiksem ROLE_
                        authorities = List.of(
                            new SimpleGrantedAuthority(role),
                            new SimpleGrantedAuthority("ROLE_" + role)
                        );
                        log.info("JWT AUTH: Added both original role: {} and prefixed role: ROLE_{}", role, role);
                    }
                } else {
                    authorities = userDetails.getAuthorities();
                    log.info("JWT AUTH: Using authorities from userDetails: {}", authorities);
                }
                log.info("JWT AUTH: Final authorities for user {}: {}", userEmail, authorities);

                // Logowanie szczegółów o aktualnym żądaniu
                log.info("JWT AUTH: Request path: {}, method: {}", request.getServletPath(), request.getMethod());

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        authorities
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                log.warn("JWT AUTH: token invalid or revoked for user={}", userEmail);
            }
        }
        filterChain.doFilter(request, response);
    }
}
