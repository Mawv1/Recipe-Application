package org.example.recipeapplication.model;

import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.With;

import java.sql.Timestamp;
import java.util.List;

@Data
@With
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class Recipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private Float rate;

    private Float estimatedTimeToPrepare;

    @OneToOne
    private AppUser author;

    private Timestamp dateOfCreation;

    private Timestamp dateOfModification;

    @ManyToMany
    @JoinTable(
            name = "recipe_ingredient",
            joinColumns = @JoinColumn(name = "recipe_id"),
            inverseJoinColumns = @JoinColumn(name = "ingredient_id")
    )
    private List<Ingredient> ingredients;

    @ManyToOne
    private RecipeCategory recipeCategory;

    @ManyToOne
    private MealCategory mealCategory;

    @OneToMany
    private List<RecipeImage> images;

    @OneToMany
    private List<RecipeTag> tags;
}
