package com.eleonetech.app.dto;

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
public class ArticleResponse {
    private String id; // ✅ Changé de Long à String
    private String ref;
    private String article;
    private String famille;
    private String sousFamille;
    private String typeProcess;
    private String typeProduit;
    private Double prixUnitaire;
    private Integer mpq;
    private Integer stock;
    private String imageFilename;

    @Builder.Default
    private List<String> clients = new ArrayList<>();

    @Builder.Default
    private List<ProcessDetailDTO> processes = new ArrayList<>();

    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}