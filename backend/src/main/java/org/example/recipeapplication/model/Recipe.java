package org.example.recipeapplication.model;

import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.With;

import java.sql.Timestamp;
import java.util.List;

@Data
@With
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Recipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private Float rating;

    // Liczba ocen, do obliczania średniej oceny
    private Integer ratingCount;

    // Liczba osób, które polubiły przepis
    private Integer favoritesCount;

    // URL do zdjęcia głównego przepisu
    private String mainImageUrl;

    private String estimatedTimeToPrepare;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private AppUser author;

    private Timestamp dateOfCreation;

    private Timestamp dateOfModification;

    @OneToMany
    private List<Ingredient> ingredients;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany
    private List<RecipeImage> images;

    @OneToMany
    private List<RecipeTag> tags;
}
