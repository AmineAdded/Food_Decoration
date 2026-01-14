package com.eleonetech.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LivraisonResponse {
    private String id; // ✅ Changé de Long à String
    private String numeroBL;
    private String articleRef;
    private String articleNom;
    private String clientNom;
    private String numeroCommandeClient;
    private Integer quantiteLivree;
    private String dateLivraison;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}