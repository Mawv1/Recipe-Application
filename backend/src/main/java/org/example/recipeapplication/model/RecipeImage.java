package org.example.recipeapplication.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.With;

@Data
@With
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class RecipeImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String path;

    @ManyToOne
    private Recipe recipe;
}
