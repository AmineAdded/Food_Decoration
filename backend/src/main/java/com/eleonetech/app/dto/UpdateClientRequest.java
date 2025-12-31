package com.eleonetech.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateClientRequest {
    @NotBlank(message = "Le nom complet du client est obligatoire")
    private String nomComplet;

    private String adresseLivraison;
    private String adresseFacturation;
    private String devise;
    private String modeTransport;
    private String incoTerme;
}
