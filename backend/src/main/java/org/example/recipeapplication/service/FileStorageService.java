package org.example.recipeapplication.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.file-storage.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.file-storage.recipe-images-dir:recipe-images}")
    private String recipeImagesDir;

    /**
     * Inicjalizuje katalogi do przechowywania plików, jeśli nie istnieją
     */
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path recipeImagesPath = uploadPath.resolve(recipeImagesDir);
            if (!Files.exists(recipeImagesPath)) {
                Files.createDirectories(recipeImagesPath);
            }
        } catch (IOException e) {
            throw new StorageException("Nie można zainicjalizować katalogów do przechowywania plików", e);
        }
    }

    /**
     * Zapisuje plik zdjęcia przepisu i zwraca URL do tego pliku
     *
     * @param file plik zdjęcia
     * @return URL do zapisanego pliku
     */
    public String storeRecipeImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new StorageException("Nie można zapisać pustego pliku");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

        // Sprawdzenie, czy nazwa pliku nie zawiera nieprawidłowych znaków
        if (originalFilename.contains("..")) {
            throw new StorageException("Nazwa pliku zawiera nieprawidłową ścieżkę: " + originalFilename);
        }

        // Generowanie unikalnej nazwy pliku
        String fileExtension = "";
        int lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            fileExtension = originalFilename.substring(lastDotIndex);
        }
        String newFilename = UUID.randomUUID().toString() + fileExtension;

        try {
            Path targetLocation = getRecipeImagesPath().resolve(newFilename);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            // Zwracamy względną ścieżkę jako URL
            return recipeImagesDir + "/" + newFilename;

        } catch (IOException e) {
            throw new StorageException("Nie można zapisać pliku " + originalFilename, e);
        }
    }

    /**
     * Zwraca ścieżkę do katalogu ze zdjęciami przepisów
     */
    private Path getRecipeImagesPath() {
        return Paths.get(uploadDir).resolve(recipeImagesDir);
    }

    /**
     * Usuwa plik zdjęcia na podstawie jego URL
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        try {
            String fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
            Path filePath = getRecipeImagesPath().resolve(fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new StorageException("Błąd podczas usuwania pliku: " + fileUrl, e);
        }
    }

    /**
     * Klasa wyjątku dla błędów związanych z przechowywaniem plików
     */
    public static class StorageException extends RuntimeException {
        public StorageException(String message) {
            super(message);
        }

        public StorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
