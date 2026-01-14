package com.eleonetech.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientResponse {
    private String id; // ✅ Changé de Long à String
    private String ref;
    private String nomComplet;
    private String adresseLivraison;
    private String adresseFacturation;
    private String devise;
    private String modeTransport;
    private String incoTerme;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}