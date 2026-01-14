package com.eleonetech.app.entity;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    private String id;

    // ✅ sparse = true permet plusieurs documents avec ref = null
    // mais garantit l'unicité pour les valeurs non-null
    @Indexed(unique = true, sparse = true)
    private String ref;

    @NotBlank(message = "Le nom complet du client est obligatoire")
    @Indexed(unique = true)
    private String nomComplet;

    private String adresseLivraison;
    private String adresseFacturation;
    private String devise;
    private String modeTransport;
    private String incoTerme;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean isActive = true;
}