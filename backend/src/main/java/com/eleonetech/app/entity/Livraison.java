package com.eleonetech.app.entity;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "livraisons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Livraison {

    @Id
    private String id;

    @Indexed(unique = true)
    private String numeroBL; // Format: 1/2026, 2/2026, etc.

    @DBRef
    @NotNull(message = "L'article est obligatoire")
    private Article article;

    @DBRef
    @NotNull(message = "Le client est obligatoire")
    private Client client;

    @DBRef
    @NotNull(message = "La commande est obligatoire")
    private Commande commande;

    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 1, message = "La quantité doit être au moins 1")
    private Integer quantiteLivree;

    @NotNull(message = "La date de livraison est obligatoire")
    private LocalDate dateLivraison;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean isActive = true;
}