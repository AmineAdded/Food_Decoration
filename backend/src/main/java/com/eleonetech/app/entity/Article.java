package com.eleonetech.app.entity;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Article {

    @Id
    private String id;

    @NotBlank(message = "La référence de l'article est obligatoire")
    @Indexed(unique = true)
    private String ref;

    @NotBlank(message = "Le nom de l'article est obligatoire")
    private String article;

    private String famille;
    private String sousFamille;
    private String typeProcess;
    private String typeProduit;
    private Double prixUnitaire;
    private Integer mpq;

    @Builder.Default
    private Integer stock = 0;

    private String imageUrl;

    // Références vers les clients (DBRef pour relation)
    @DBRef
    @Builder.Default
    private List<Client> clients = new ArrayList<>();

    // Liste embarquée des processes avec leurs attributs
    @Builder.Default
    private List<ArticleProcessInfo> processes = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean isActive = true;

    // Classe interne pour stocker les infos de process
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ArticleProcessInfo {
        @DBRef
        private Process process;
        private Double tempsParPF;
        private Integer cadenceMax;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // Méthodes utilitaires
    public void addClient(Client client) {
        if (!clients.contains(client)) {
            clients.add(client);
        }
    }

    public void removeClient(Client client) {
        clients.remove(client);
    }

    public void addProcess(Process process, Double tempsParPF, Integer cadenceMax) {
        ArticleProcessInfo info = ArticleProcessInfo.builder()
                .process(process)
                .tempsParPF(tempsParPF)
                .cadenceMax(cadenceMax)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        processes.add(info);
    }

    public void removeProcess(Process process) {
        processes.removeIf(ap -> ap.getProcess().equals(process));
    }
}