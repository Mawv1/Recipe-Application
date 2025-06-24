package org.example.recipeapplication.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.With;

import java.sql.Timestamp;

@Data
@With
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "author_id", unique = false)
    private AppUser author;

    @ManyToOne
    @JoinColumn(name = "recipe_id", unique = false)
    private Recipe recipe;

    private String content;

    private Integer likesCount;

    private Integer dislikesCount;

    private Timestamp dateOfCreation;
}
