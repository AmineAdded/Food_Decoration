package com.eleonetech.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO pour créer un client
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateClientRequest {
    @NotBlank(message = "Le nom complet du client est obligatoire")
    private String nomComplet;

    private String adresseLivraison;
    private String adresseFacturation;
    private String devise; // USD, EUR, TND
    private String modeTransport; // Terrestre, Aérien, Maritime
    private String incoTerme; // EXW, EDDU, DAP, DDP, FSA
}