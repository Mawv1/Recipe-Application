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
public class Note {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    private Recipe recipe;

    @OneToOne
    private AppUser author;

    private String content;

    private Timestamp dateOfCreation;

    private Timestamp dateOfModification;
}
