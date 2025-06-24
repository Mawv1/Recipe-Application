package org.example.recipeapplication.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.example.recipeapplication.dto.UserResponseDTO;
import org.example.recipeapplication.model.AppUser;
import org.example.recipeapplication.repos.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final AppUserRepository userRepository;

    /**
     * Blokuje użytkownika, uniemożliwiając mu dodawanie przepisów i komentarzy
     *
     * @param userId ID użytkownika do zablokowania
     * @param reason Powód blokady (opcjonalny)
     * @return Informacje o zablokowanym użytkowniku
     * @throws EntityNotFoundException jeśli użytkownik nie istnieje
     */
    @Transactional
    public UserResponseDTO banUser(Long userId, String reason) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        user.setBanned(true);
        user.setBanReason(reason);

        AppUser savedUser = userRepository.save(user);
        return mapToDTO(savedUser);
    }

    /**
     * Odblokowuje zablokowanego wcześniej użytkownika
     *
     * @param userId ID użytkownika do odblokowania
     * @return Informacje o odblokowanym użytkowniku
     * @throws EntityNotFoundException jeśli użytkownik nie istnieje
     */
    @Transactional
    public UserResponseDTO unbanUser(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        user.setBanned(false);
        user.setBanReason(null);

        AppUser savedUser = userRepository.save(user);
        return mapToDTO(savedUser);
    }

    /**
     * Sprawdza czy użytkownik jest zablokowany
     *
     * @param userId ID użytkownika do sprawdzenia
     * @return true jeśli użytkownik jest zablokowany, false w przeciwnym razie
     * @throws EntityNotFoundException jeśli użytkownik nie istnieje
     */
    public boolean isUserBanned(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        return user.isBanned();
    }

    /**
     * Sprawdza czy użytkownik jest zablokowany (wersja z emailem)
     *
     * @param email Email użytkownika do sprawdzenia
     * @return true jeśli użytkownik jest zablokowany, false w przeciwnym razie
     * @throws EntityNotFoundException jeśli użytkownik nie istnieje
     */
    public boolean isUserBanned(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));

        return user.isBanned();
    }

    /**
     * Konwertuje obiekt użytkownika na DTO
     */
    private UserResponseDTO mapToDTO(AppUser user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePicture(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null,
                user.isBanned(),
                user.getBanReason(),
                null  // nie pobieramy przepisów użytkownika
        );
    }
}
