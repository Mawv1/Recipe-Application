package org.example.recipeapplication.config;

import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.model.Permission;
import org.example.recipeapplication.model.Role;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.example.recipeapplication.model.Role.ADMIN;
import static org.springframework.http.HttpMethod.*;
import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] WHITE_LIST_URL = {"/api/v1/auth/**",
            "/v2/api-docs",
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-resources",
            "/swagger-resources/**",
            "/configuration/ui",
            "/configuration/security",
            "/swagger-ui/**",
            "/webjars/**",
            "/swagger-ui.html",
            "/uploads/**" // Dodana ścieżka dla plików obrazów w katalogu uploads
            // Usunięto "/api/v1/recipes/pending" z listy publicznych endpointów
    };

    // Endpointy związane z przeglądaniem przepisów, dostępne bez autentykacji
    private static final String[] PUBLIC_RECIPE_ENDPOINTS = {
            "/api/v1/recipes/search",
            "/api/v1/recipes/category/**",
            "/api/v1/recipes/user/**",
            "/api/v1/recipes/{id:[\\d]+}",
            "/api/v1/users/*/followed-recipes", // przeglądanie śledzonych przepisów innych użytkowników
            "/api/v1/users/email/*", // wyszukiwanie użytkownika po emailu
            "/api/v1/users/*/password"
    };

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final LogoutHandler logoutHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {
                    cors.configurationSource(request -> {
                        var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                        corsConfig.setAllowedOriginPatterns(java.util.List.of("localhost:3000", "http://localhost:3000", "http://localhost:8080"));
                        corsConfig.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                        corsConfig.setAllowedHeaders(java.util.List.of("*"));
                        corsConfig.setAllowCredentials(true);
                        corsConfig.setMaxAge(3600L);
                        return corsConfig;
                    });
                })
                .authorizeHttpRequests(req ->
                        req.requestMatchers(WHITE_LIST_URL)
                                .permitAll()
                                // Jawnie dodajemy endpoint uwierzytelniania, aby upewnić się, że jest dostępny
                                .requestMatchers("/api/v1/auth/authenticate")
                                .permitAll()
                                // Publiczne endpointy - tylko GET
                                .requestMatchers(GET, PUBLIC_RECIPE_ENDPOINTS)
                                .permitAll()

                                // Endpointy wymagające uwierzytelnienia - wszystkie operacje modyfikujące śledzenie
                                .requestMatchers(POST, "/api/v1/users/me/followed-recipes/*")
                                .authenticated()
                                .requestMatchers(DELETE, "/api/v1/users/me/followed-recipes/*")
                                .authenticated()
                                .requestMatchers(GET, "/api/v1/users")
                                .hasAuthority("ADMIN")
                                .requestMatchers(POST, "/api/v1/recipes/*/follow")
                                .authenticated()
                                .requestMatchers(DELETE, "/api/v1/recipes/*/follow")
                                .authenticated()
                                .requestMatchers(GET, "/api/v1/users/me/followed-recipes/*/status")
                                .authenticated()
                                .requestMatchers(PUT,"/api/v1/users/*/password")
                                .authenticated()
                                .requestMatchers(GET, "/api/v1/recipes")
                                .permitAll()
                                .requestMatchers(POST, "/api/v1/recipes")
//                                .hasAuthority("ADMIN")
                                .authenticated()
                                .requestMatchers(GET, "/api/v1/recipes/my-recipes")
                                .authenticated()
                                .requestMatchers(PUT, "/api/v1/recipes/*")
                                .authenticated()
                                .requestMatchers(DELETE, "/api/v1/recipes/*")
                                .authenticated()
                                .requestMatchers(GET, "/api/v1/recipes/pending")
                                .hasAuthority("ADMIN")

                                // Konfiguracja zabezpieczeń dla endpointów komentarzy
                                .requestMatchers(GET, "/api/v1/recipes/*/comments")
                                .permitAll()  // Przeglądanie komentarzy dostępne dla wszystkich
                                .requestMatchers(GET, "/api/v1/comments/*")
                                .permitAll()  // Pobieranie pojedynczego komentarza dostępne dla wszystkich
                                .requestMatchers(POST, "/api/v1/recipes/{id:[\\d]+}/comments")
                                .authenticated()  // Dodawanie komentarzy tylko dla zalogowanych (dokładniejsza ścieżka)
                                .requestMatchers(POST, "/api/v1/recipes/*/comments")
                                .authenticated()  // Dodawanie komentarzy tylko dla zalogowanych
                                .requestMatchers(DELETE, "/api/v1/comments/*")
                                .authenticated()  // Usuwanie komentarzy tylko dla zalogowanych
                                .requestMatchers(DELETE, "/api/v1/recipes/comments/*")
                                .authenticated()  // Stara ścieżka (dla kompatybilności wstecznej)

                                // Konfiguracja dla reakcji na komentarze
                                .requestMatchers("/api/v1/comments/*/like", "/api/v1/comments/*/dislike", "/api/v1/comments/*/reaction", "/api/v1/comments/*/user-reaction",
                                                "/api/v1/comments/*/liked", "/api/v1/comments/*/disliked")
                                .authenticated()  // Reakcje na komentarze tylko dla zalogowanych

                                .requestMatchers(POST, "/api/v1/recipes/*/rate")
                                .authenticated()
                                .requestMatchers(GET, "/api/v1/categories")
                                .permitAll()
                                .requestMatchers(POST, "/api/v1/categories")
                                .hasAuthority("ADMIN") // Zmienione by pasowało do roli z JWT ("ADMIN" bez prefiksu)
                                .requestMatchers(POST, "/api/v1/uploads").authenticated()

                                // Pozostałe reguły
                                .requestMatchers(POST, "/api/v1/recipes/add").hasAuthority(String.valueOf(Permission.RECIPE_CREATE))
                                .requestMatchers("/api/v1/management/**").hasAnyRole(ADMIN.name())
                                .anyRequest()
                                .authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .logout(logout ->
                        logout.logoutUrl("/api/v1/auth/logout")
                                .addLogoutHandler(logoutHandler)
                                .logoutSuccessHandler((request, response, authentication) -> SecurityContextHolder.clearContext())
                );
        return http.build();
    }
}
