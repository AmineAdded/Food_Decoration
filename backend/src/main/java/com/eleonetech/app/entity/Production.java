package com.eleonetech.app.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "productions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Production {

    @Id
    private String id;

    // ✅ SOLUTION : Stocker l'ID de l'article directement
    // Au lieu d'une DBRef qui ne peut pas être interrogée avec "article.ref"
    private String articleId;

    // Optionnel : stocker aussi la ref pour faciliter les recherches
    private String articleRef;

    private Integer quantite;
    private LocalDate dateProduction;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean isActive = true;

    // ✅ Article chargé à la demande (non stocké en base)
    @Transient
    private Article article;
}