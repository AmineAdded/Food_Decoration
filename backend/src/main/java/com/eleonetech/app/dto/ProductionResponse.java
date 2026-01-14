package com.eleonetech.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionResponse {
    private String id; // ✅ Changé de Long à String
    private String articleRef;
    private String articleNom;
    private Integer quantite;
    private String dateProduction;
    private Integer stockActuel;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}