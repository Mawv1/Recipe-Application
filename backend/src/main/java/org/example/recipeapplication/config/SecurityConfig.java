package org.example.recipeapplication.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
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
            "/api/v1/recipes"};
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final LogoutHandler logoutHandler;
// adnotacja do curla zeby byl token
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                    corsConfig.setAllowedOrigins(java.util.List.of("http://localhost:3000", "https://localhost:8000"));
                    corsConfig.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    corsConfig.setAllowedHeaders(java.util.List.of("*"));
                    corsConfig.setAllowCredentials(true);
                    return corsConfig;
                }))
                .authorizeHttpRequests(req ->
                        req.requestMatchers(WHITE_LIST_URL)
                                .permitAll()
                                .requestMatchers(POST, "/api/v1/recipes/add").hasAuthority("RECIPE_CREATE")
                                .requestMatchers("/api/v1/management/**").hasAnyRole(ADMIN.name())
                                .requestMatchers(GET, "/api/v1/recipes/**").hasAnyAuthority("RECIPE_READ", "ADMIN_READ")
                                .requestMatchers(POST, "/api/v1/recipes/**").hasAuthority("ADMIN_CREATE") // zamiast stringow uzyj enuma permission
                                .requestMatchers(PUT, "/api/v1/recipes/**").hasAuthority("ADMIN_UPDATE")
                                .requestMatchers(DELETE, "/api/v1/recipes/**").hasAuthority("ADMIN_DELETE")
                                .requestMatchers(GET, "/api/v1/users/**").hasAnyAuthority("USER_READ", "ADMIN_READ")
                                .requestMatchers(POST, "/api/v1/users/**").hasAuthority("USER_CREATE")
                                .requestMatchers(PUT, "/api/v1/users/**").hasAuthority("USER_UPDATE")
                                .requestMatchers(DELETE, "/api/v1/users/**").hasAuthority("USER_DELETE")
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

//    @Bean
//    public LogoutHandler logoutHandler() {
//        return (request, response, authentication) -> {
//            // logika wylogowania, np. czyszczenie tokenów
//        };
//    }
}

