package org.example.recipeapplication.auth;

import lombok.RequiredArgsConstructor;
import lombok.var;
import org.example.recipeapplication.config.JwtService;
import org.example.recipeapplication.model.Role;
import org.example.recipeapplication.repos.AppUserRepository;
import org.example.recipeapplication.model.AppUser;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;


    public AuthenticationResponse register(RegisterRequest request) {
        var user = AppUser.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();
        appUserRepository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse
                .builder()
                .token(jwtToken)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {


    }
}
