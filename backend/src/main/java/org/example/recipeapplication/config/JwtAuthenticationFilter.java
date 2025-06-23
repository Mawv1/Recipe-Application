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
        String path = request.getServletPath();
        String method = request.getMethod();
        log.info("Request path: {}, method: {}", path, method);

        // Pomijamy filtr dla endpointów autoryzacyjnych
        if (request.getServletPath().contains("/api/v1/auth")) {
            log.info("Skipping filter for auth endpoint");
            filterChain.doFilter(request, response);
            return;
        }

        // Pomijamy filtr dla publicznych endpointów tylko dla GET
        if ((path.equals("/api/v1/recipes") && method.equals("GET")) ||
            path.startsWith("/api/v1/recipes/search") ||
            path.startsWith("/api/v1/recipes/category/") ||
            path.startsWith("/api/v1/recipes/user/") ||
            // Modyfikacja warunku - tylko GET i tylko dla określonych ścieżek (nie dla /pending, /my-recipes i nie dla operacji PUT)
            (path.startsWith("/api/v1/recipes/") && method.equals("GET") &&
             !path.equals("/api/v1/recipes/pending") && !path.equals("/api/v1/recipes/my-recipes") &&
             path.matches("/api/v1/recipes/\\d+")) || // Tylko dla GET pojedynczego przepisu
            // Publiczne endpointy dla obserwowanych przepisów
            path.matches("/api/v1/users/\\d+/followed-recipes") ||
            path.startsWith("/api/v1/users/email/")) {
            log.info("Skipping filter for public endpoint");
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        log.info("Authorization header: {}", authHeader != null ? "present" : "missing");

        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("No Authorization header or not Bearer token");
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring("Bearer ".length());

        // Sprawdź czy token nie jest "undefined" lub pusty
        if (jwt == null || jwt.isEmpty() || "undefined".equals(jwt) || jwt.length() < 10) {
            log.error("Invalid token received: {}", jwt);

            // Ustawienie nagłówków CORS
            response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.setHeader("Access-Control-Allow-Credentials", "true");

            // Ustawienie typu odpowiedzi na JSON
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

            // Zwrócenie odpowiedzi w formacie JSON
            String jsonResponse = String.format("{\"status\":\"error\",\"code\":401,\"message\":\"Nieprawidłowy token autoryzacyjny. Zaloguj się ponownie.\",\"needsLogin\":true,\"timestamp\":\"%s\"}",
                                              java.time.LocalDateTime.now());
            response.getWriter().write(jsonResponse);
            return;
        }

        try {
            // Dodajemy logowanie tokenu (tylko część początkową dla bezpieczeństwa)
            if (jwt.length() > 10) {
                log.info("Token format check - first 10 chars: {}, contains periods: {}, length: {}",
                      jwt.substring(0, 10),
                      jwt.contains("."),
                      jwt.length());
            } else {
                log.info("Token too short, possible malformed token: {}", jwt);
            }

            userEmail = jwtService.extractUsername(jwt);
            log.info("Extracted email from token: {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to extract username from token", e);

            // Ustawienie nagłówków CORS
            response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.setHeader("Access-Control-Allow-Credentials", "true");

            // Ustawienie typu odpowiedzi na JSON
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

            // Zwrócenie odpowiedzi w formacie JSON
            String jsonResponse = String.format("{\"status\":\"error\",\"code\":401,\"message\":\"Błąd weryfikacji tokenu: %s. Zaloguj się ponownie.\",\"needsLogin\":true,\"timestamp\":\"%s\"}",
                                              e.getMessage(),
                                              java.time.LocalDateTime.now());
            response.getWriter().write(jsonResponse);
            return;
        }

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                log.info("Loaded user details for email: {}", userEmail);

                var isTokenValid = tokenRepository.findByToken(jwt)
                        .map(t -> !t.isExpired() && !t.isRevoked())
                        .orElse(false);
                log.info("Token valid according to repository: {}", isTokenValid);

                if (jwtService.isTokenValid(jwt, userDetails) && isTokenValid) {
                    // Pobierz rolę z tokena JWT
                    String role = (String) jwtService.extractAllClaims(jwt).get("role");
                    log.info("Extracted role from token: {}", role);

                    Collection<? extends GrantedAuthority> authorities;
                    if (role != null) {
                        // Zachowujemy oryginalną rolę z tokenu JWT i dodajemy również wersję z prefiksem ROLE_
                        // aby zapewnić kompatybilność z różnymi metodami sprawdzania uprawnień
                        if (role.startsWith("ROLE_")) {
                            authorities = List.of(new SimpleGrantedAuthority(role));
                        } else {
                            // Dodajemy dwie wersje uprawnienia - oryginalną i z prefiksem ROLE_
                            authorities = List.of(
                                new SimpleGrantedAuthority(role),
                                new SimpleGrantedAuthority("ROLE_" + role)
                            );
                        }
                    } else {
                        authorities = userDetails.getAuthorities();
                    }

                    log.info("User authorities: {}", authorities);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            authorities
                    );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("Successfully set authentication in SecurityContext");
                } else {
                    log.warn("JWT AUTH: token invalid or revoked for user={}", userEmail);
                }
            } catch (UsernameNotFoundException e) {
                log.warn("User not found: {}", userEmail, e);
            } catch (Exception e) {
                log.error("Error during authentication", e);
            }
        }
        filterChain.doFilter(request, response);
    }
}
