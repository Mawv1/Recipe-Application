package org.example.recipeapplication.util;

import java.security.SecureRandom;
import java.util.Base64;

public class SecretKeyGenerator {
    public static void main(String[] args) {
        // Generowanie losowego klucza o długości 64 bajtów (512 bitów)
        SecureRandom secureRandom = new SecureRandom();
        byte[] key = new byte[64];
        secureRandom.nextBytes(key);

        // Kodowanie klucza w formacie heksadecymalnym
        StringBuilder hexKey = new StringBuilder();
        for (byte b : key) {
            hexKey.append(String.format("%02x", b));
        }
        System.out.println("Heksadecymalny klucz tajny (hex): " + hexKey);

        // Alternatywnie możesz użyć Base64
        String base64Key = Base64.getEncoder().encodeToString(key);
        System.out.println("Base64 klucz tajny: " + base64Key);
    }
}
