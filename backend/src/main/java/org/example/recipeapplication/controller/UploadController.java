package org.example.recipeapplication.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/uploads")
@Tag(name = "Upload plików", description = "Operacje związane z przesyłaniem plików do serwera")
public class UploadController {

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Prześlij plik",
              description = "Pozwala na przesłanie pliku na serwer. Plik otrzymuje unikalną nazwę. Wymaga uwierzytelnienia.")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get("uploads", fileName);
        try {
            Files.createDirectories(filePath.getParent());
            Files.copy(file.getInputStream(), filePath);
            String fileUrl = "/uploads/" + fileName;
            return ResponseEntity.ok(fileUrl);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Błąd uploadu pliku");
        }
    }
}

