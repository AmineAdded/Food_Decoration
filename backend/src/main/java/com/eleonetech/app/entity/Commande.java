package com.eleonetech.app.entity;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "commandes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commande {

    @Id
    private String id;

    // ✅ SOLUTION : Stocker les IDs et refs directement
    @NotNull(message = "L'article est obligatoire")
    private String articleId;
    private String articleRef;      // Pour faciliter les recherches
    private String articleNom;      // Pour l'affichage

    private String numeroCommandeClient;

    @NotNull(message = "Le client est obligatoire")
    private String clientId;
    private String clientNom;       // Pour faciliter les recherches et l'affichage

    @NotNull(message = "La quantité est obligatoire")
    @Min(value = 1, message = "La quantité doit être au moins 1")
    private Integer quantite;

    @NotNull(message = "Le type de commande est obligatoire")
    private String typeCommande; // "PLANIFIEE" ou "FERME"

    @NotNull(message = "La date souhaitée est obligatoire")
    private LocalDate dateSouhaitee;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean isActive = true;

    // ✅ Objets chargés à la demande (non stockés en base)
    @Transient
    private Article article;

    @Transient
    private Client client;
}