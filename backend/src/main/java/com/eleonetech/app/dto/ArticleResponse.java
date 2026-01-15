package com.eleonetech.app.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // ✅ AJOUTER CETTE LIGNE
public class ArticleResponse {
    private String id;
    private String ref;
    private String article;
    private String famille;
    private String sousFamille;
    private String typeProcess;
    private String typeProduit;
    private Double prixUnitaire;
    private Integer mpq;
    private Integer stock;
    private String imageUrl; // ✅ DÉJÀ PRÉSENT

    @Builder.Default
    private List<String> clients = new ArrayList<>();

    @Builder.Default
    private List<ProcessDetailDTO> processes = new ArrayList<>();

    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}