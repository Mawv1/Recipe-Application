package org.example.recipeapplication.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.With;

import java.util.List;

@Data
@With
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class RecipeCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany
    private List<Recipe> recipes;
}
