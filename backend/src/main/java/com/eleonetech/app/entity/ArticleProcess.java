//package com.eleonetech.app.entity;
//
//import jakarta.persistence.*;
//import lombok.AllArgsConstructor;
//import lombok.Builder;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//import java.time.LocalDateTime;
//
//@Entity
//@Table(name = "article_processes")
//@Data
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//public class ArticleProcess {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "article_id", nullable = false)
//    private Article article;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "process_id", nullable = false)
//    private com.eleonetech.app.entity.Process process;
//
//    @Column(name = "temps_par_pf")
//    private Double tempsParPF; // Temps en secondes par pièce finie
//
//    @Column(name = "cadence_max")
//    private Integer cadenceMax; // Cadence maximum en pièces par machine par heure
//
//    @Column(name = "created_at", nullable = false, updatable = false)
//    private LocalDateTime createdAt;
//
//    @Column(name = "updated_at")
//    private LocalDateTime updatedAt;
//
//    @PrePersist
//    protected void onCreate() {
//        createdAt = LocalDateTime.now();
//        updatedAt = LocalDateTime.now();
//    }
//
//    @PreUpdate
//    protected void onUpdate() {
//        updatedAt = LocalDateTime.now();
//    }
//}