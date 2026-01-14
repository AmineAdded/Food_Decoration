package com.eleonetech.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeResponse {
    private String id; // ✅ Changé de Long à String
    private String articleRef;
    private String articleNom;
    private String clientNom;
    private Integer quantite;
    private String numeroCommandeClient;
    private String typeCommande;
    private String dateSouhaitee;
    private String dateAjout;
    private Integer quantiteLivree;
    private Integer quantiteNonLivree;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}