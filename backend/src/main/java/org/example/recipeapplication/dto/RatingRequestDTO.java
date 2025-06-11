package org.example.recipeapplication.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RatingRequestDTO {

    @NotNull(message = "Ocena jest wymagana")
    @Min(value = 1, message = "Ocena musi być pomiędzy 1 a 5")
    @Max(value = 5, message = "Ocena musi być pomiędzy 1 a 5")
    private Integer value;
}
