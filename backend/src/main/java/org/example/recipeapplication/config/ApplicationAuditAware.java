package org.example.recipeapplication.config;

import org.springframework.data.domain.AuditorAware;

import java.util.Optional;

public class ApplicationAuditAware implements AuditorAware<Integer> {
    @Override
    public Optional<Integer> getCurrentAuditor() {
        // Zwróć identyfikator aktualnego użytkownika, np. z kontekstu Spring Security
        // Przykład: return Optional.of(1);
        return Optional.empty();
    }
}
