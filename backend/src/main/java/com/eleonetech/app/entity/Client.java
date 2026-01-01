package com.eleonetech.app.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ref", unique = true, length = 50)
    private String ref;

    @NotBlank(message = "Le nom complet du client est obligatoire")
    @Column(name = "nom_complet", nullable = false, unique = true)
    private String nomComplet;

    @Column(name = "adresse_livraison", length = 500)
    private String adresseLivraison;

    @Column(name = "adresse_facturation", length = 500)
    private String adresseFacturation;

    @Column(name = "devise", length = 50)
    private String devise; // USD, EUR, TND

    @Column(name = "mode_transport", length = 50)
    private String modeTransport; // Terrestre, Aérien, Maritime

    @Column(name = "inco_terme", length = 50)
    private String incoTerme; // EXW, EDDU, DAP, DDP, FSA

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}