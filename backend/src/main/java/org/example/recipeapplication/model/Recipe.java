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

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Float rating;

    // Liczba ocen, do obliczania średniej oceny
    private Integer ratingCount;

    // Liczba osób, które polubiły przepis
    private Integer favoritesCount;

    // URL do zdjęcia głównego przepisu
    @Column(length = 1000)
    private String mainImageUrl;

    @Column(length = 100)
    private String estimatedTimeToPrepare;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private AppUser author;

    private Timestamp dateOfCreation;

    private Timestamp dateOfModification;

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.REMOVE)
    private List<Ingredient> ingredients;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany
    private List<RecipeImage> images;

    // Komentarze do przepisu
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.REMOVE, fetch = FetchType.EAGER)
    private List<Comment> comments;

    // Zmiana z listy obiektów RecipeTag na listę stringów
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_tags", joinColumns = @JoinColumn(name = "recipe_id"))
    @Column(name = "tag")
    private List<String> tags;

    @Enumerated(EnumType.STRING)
    private RecipeStatus status;
}
