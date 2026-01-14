package com.eleonetech.app.service;

import com.eleonetech.app.dto.CreateProductionRequest;
import com.eleonetech.app.dto.ProductionResponse;
import com.eleonetech.app.dto.UpdateProductionRequest;
import com.eleonetech.app.entity.Article;
import com.eleonetech.app.entity.Production;
import com.eleonetech.app.repository.ArticleRepository;
import com.eleonetech.app.repository.ProductionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionService {

    private final ProductionRepository productionRepository;
    private final ArticleRepository articleRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public ProductionResponse createProduction(CreateProductionRequest request) {
        // Trouver l'article
        Article article = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        // Parser la date
        LocalDate dateProduction = LocalDate.parse(request.getDateProduction(), DATE_FORMATTER);

        // ✅ Créer la production avec articleId et articleRef
        Production production = Production.builder()
                .articleId(article.getId())
                .articleRef(article.getRef())
                .quantite(request.getQuantite())
                .dateProduction(dateProduction)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        production = productionRepository.save(production);

        // METTRE À JOUR LE STOCK
        article.setStock(article.getStock() + request.getQuantite());
        article.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(article);

        log.info("Production créée: {} unités de {} le {}",
                request.getQuantite(), article.getArticle(), dateProduction);

        // Charger l'article pour le retour
        production.setArticle(article);
        return mapToResponse(production);
    }

    public List<ProductionResponse> getAllProductions() {
        List<Production> productions = productionRepository.findAllActiveWithArticle();
        return productions.stream()
                .map(this::loadArticleAndMap)
                .collect(Collectors.toList());
    }

    public ProductionResponse getProductionById(String id) {
        Production production = productionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Production non trouvée"));
        return loadArticleAndMap(production);
    }

    public List<ProductionResponse> searchByArticleRef(String articleRef) {
        return productionRepository.findByArticleRef(articleRef)
                .stream()
                .map(this::loadArticleAndMap)
                .collect(Collectors.toList());
    }

    public List<ProductionResponse> searchByDate(String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        return productionRepository.findByDate(localDate)
                .stream()
                .map(this::loadArticleAndMap)
                .collect(Collectors.toList());
    }

    public List<ProductionResponse> searchByArticleRefAndDate(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        return productionRepository.findByArticleRefAndDate(articleRef, localDate)
                .stream()
                .map(this::loadArticleAndMap)
                .collect(Collectors.toList());
    }

    public List<ProductionResponse> searchByYearAndMonth(int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        return productionRepository.findByDateBetween(startDate, endDate)
                .stream()
                .map(this::loadArticleAndMap)
                .collect(Collectors.toList());
    }

    public List<ProductionResponse> searchByArticleRefAndYearAndMonth(String articleRef, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        return productionRepository.findByArticleRefAndDateBetween(articleRef, startDate, endDate)
                .stream()
                .map(this::loadArticleAndMap)
                .sorted((p1, p2) -> p2.getDateProduction().compareTo(p1.getDateProduction()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductionResponse updateProduction(String id, UpdateProductionRequest request) {
        Production production = productionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Production non trouvée"));

        // ANNULER L'ANCIENNE QUANTITÉ DU STOCK
        Article oldArticle = articleRepository.findById(production.getArticleId())
                .orElseThrow(() -> new RuntimeException("Article original non trouvé"));

        int oldQuantite = production.getQuantite();
        oldArticle.setStock(oldArticle.getStock() - oldQuantite);
        oldArticle.setUpdatedAt(LocalDateTime.now());

        // Trouver le nouvel article
        Article newArticle = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        // Parser la nouvelle date
        LocalDate dateProduction = LocalDate.parse(request.getDateProduction(), DATE_FORMATTER);

        // ✅ Mettre à jour avec articleId et articleRef
        production.setArticleId(newArticle.getId());
        production.setArticleRef(newArticle.getRef());
        production.setQuantite(request.getQuantite());
        production.setDateProduction(dateProduction);
        production.setUpdatedAt(LocalDateTime.now());

        production = productionRepository.save(production);

        // AJOUTER LA NOUVELLE QUANTITÉ AU STOCK
        newArticle.setStock(newArticle.getStock() + request.getQuantite());
        newArticle.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(newArticle);

        // Sauvegarder l'ancien article si différent
        if (!oldArticle.getId().equals(newArticle.getId())) {
            articleRepository.save(oldArticle);
        }

        log.info("Production mise à jour: ID {} - {} unités de {}",
                id, request.getQuantite(), newArticle.getArticle());

        production.setArticle(newArticle);
        return mapToResponse(production);
    }

    @Transactional
    public void deleteProduction(String id) {
        Production production = productionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Production non trouvée"));

        // RETIRER LA QUANTITÉ DU STOCK
        Article article = articleRepository.findById(production.getArticleId())
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));

        article.setStock(article.getStock() - production.getQuantite());
        article.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(article);

        productionRepository.deleteById(id);
        log.info("Production supprimée: ID {} - Stock mis à jour pour {}", id, article.getArticle());
    }

    // ✅ Méthode helper pour charger l'article
    private ProductionResponse loadArticleAndMap(Production production) {
        Article article = articleRepository.findById(production.getArticleId())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + production.getArticleId()));
        production.setArticle(article);
        return mapToResponse(production);
    }

    private ProductionResponse mapToResponse(Production production) {
        Article article = production.getArticle();
        if (article == null) {
            article = articleRepository.findById(production.getArticleId())
                    .orElseThrow(() -> new RuntimeException("Article non trouvé"));
        }

        return ProductionResponse.builder()
                .id(production.getId())
                .articleRef(article.getRef())
                .articleNom(article.getArticle())
                .quantite(production.getQuantite())
                .dateProduction(production.getDateProduction().format(DATE_FORMATTER))
                .stockActuel(article.getStock())
                .isActive(production.getIsActive())
                .createdAt(production.getCreatedAt().format(DATETIME_FORMATTER))
                .updatedAt(production.getUpdatedAt().format(DATETIME_FORMATTER))
                .build();
    }
}