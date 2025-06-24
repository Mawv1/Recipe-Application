package org.example.recipeapplication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication
@EnableSpringDataWebSupport
public class RecipeApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecipeApplication.class, args);
    }

}
