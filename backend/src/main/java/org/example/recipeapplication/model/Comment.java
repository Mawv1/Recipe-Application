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

    @OneToOne
    private AppUser author;

    @OneToOne
    private Recipe recipe;

    private String content;

    private Double rate;

    private Timestamp dateOfCreation;
}
