package com.eleonetech.app.service;

import com.eleonetech.app.dto.ArticleResponse;
import com.eleonetech.app.dto.CreateArticleRequest;
import com.eleonetech.app.dto.ProcessDetailDTO;
import com.eleonetech.app.dto.UpdateArticleRequest;
import com.eleonetech.app.entity.Article;
import com.eleonetech.app.entity.ArticleClient;
import com.eleonetech.app.entity.ArticleProcess;
import com.eleonetech.app.entity.Client;
import com.eleonetech.app.repository.ArticleClientRepository;
import com.eleonetech.app.repository.ArticleProcessRepository;
import com.eleonetech.app.repository.ArticleRepository;
import com.eleonetech.app.repository.ClientRepository;
import com.eleonetech.app.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final ClientRepository clientRepository;
    private final ProcessRepository processRepository;
    private final ArticleClientRepository articleClientRepository;
    private final ArticleProcessRepository articleProcessRepository;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public ArticleResponse createArticle(CreateArticleRequest request) {
        // Vérifier si la référence existe déjà
        if (articleRepository.existsByRef(request.getRef())) {
            throw new RuntimeException("Un article avec cette référence existe déjà");
        }

        // Créer l'article
        Article article = Article.builder()
                .ref(request.getRef())
                .article(request.getArticle())
                .famille(request.getFamille())
                .sousFamille(request.getSousFamille())
                .typeProcess(request.getTypeProcess())
                .typeProduit(request.getTypeProduit())
                .prixUnitaire(request.getPrixUnitaire())
                .mpq(request.getMpq())
                .isActive(true)
                .articleClients(new ArrayList<>())
                .articleProcesses(new ArrayList<>())
                .build();

        // Ajouter les clients
        if (request.getClients() != null && !request.getClients().isEmpty()) {
            for (String clientNom : request.getClients()) {
                Client client = clientRepository.findByNomComplet(clientNom)
                        .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientNom));

                ArticleClient articleClient = ArticleClient.builder()
                        .article(article)
                        .client(client)
                        .build();
                article.getArticleClients().add(articleClient);
            }
        }

        // Ajouter les process
        if (request.getProcesses() != null && !request.getProcesses().isEmpty()) {
            for (ProcessDetailDTO processDetail : request.getProcesses()) {
                com.eleonetech.app.entity.Process process = processRepository.findByNom(processDetail.getName())
                        .orElseThrow(() -> new RuntimeException("Process non trouvé: " + processDetail.getName()));

                ArticleProcess articleProcess = ArticleProcess.builder()
                        .article(article)
                        .process(process)
                        .tempsParPF(processDetail.getTempsParPF())
                        .cadenceMax(processDetail.getCadenceMax())
                        .build();
                article.getArticleProcesses().add(articleProcess);
            }
        }

        article = articleRepository.save(article);
        log.info("Article créé: {} (Ref: {})", article.getArticle(), article.getRef());

        return mapToResponse(article);
    }

    public List<ArticleResponse> getAllArticles() {
        // ✅ Charger en deux étapes
        List<Article> articles = articleRepository.findAllActiveWithClients();

        if (!articles.isEmpty()) {
            articleRepository.findArticlesWithProcesses(articles);
        }

        return articles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ArticleResponse getArticleById(Long id) {
        Article article = articleRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));
        return mapToResponse(article);
    }

    @Transactional
    public ArticleResponse updateArticle(Long id, UpdateArticleRequest request) {
        Article article = articleRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));

        // Vérifier si la nouvelle référence existe déjà (sauf si c'est le même article)
        if (!article.getRef().equals(request.getRef()) &&
                articleRepository.existsByRef(request.getRef())) {
            throw new RuntimeException("Un article avec cette référence existe déjà");
        }

        // Mettre à jour les champs de base
        article.setRef(request.getRef());
        article.setArticle(request.getArticle());
        article.setFamille(request.getFamille());
        article.setSousFamille(request.getSousFamille());
        article.setTypeProcess(request.getTypeProcess());
        article.setTypeProduit(request.getTypeProduit());
        article.setPrixUnitaire(request.getPrixUnitaire());
        article.setMpq(request.getMpq());

        // Mettre à jour les clients
        article.getArticleClients().clear();
        if (request.getClients() != null && !request.getClients().isEmpty()) {
            for (String clientNom : request.getClients()) {
                Client client = clientRepository.findByNomComplet(clientNom)
                        .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientNom));

                ArticleClient articleClient = ArticleClient.builder()
                        .article(article)
                        .client(client)
                        .build();
                article.getArticleClients().add(articleClient);
            }
        }

        // Mettre à jour les process
        article.getArticleProcesses().clear();
        if (request.getProcesses() != null && !request.getProcesses().isEmpty()) {
            for (ProcessDetailDTO processDetail : request.getProcesses()) {
                com.eleonetech.app.entity.Process process = processRepository.findByNom(processDetail.getName())
                        .orElseThrow(() -> new RuntimeException("Process non trouvé: " + processDetail.getName()));

                ArticleProcess articleProcess = ArticleProcess.builder()
                        .article(article)
                        .process(process)
                        .tempsParPF(processDetail.getTempsParPF())
                        .cadenceMax(processDetail.getCadenceMax())
                        .build();
                article.getArticleProcesses().add(articleProcess);
            }
        }

        article = articleRepository.save(article);
        log.info("Article mis à jour: {} (Ref: {})", article.getArticle(), article.getRef());

        return mapToResponse(article);
    }

    @Transactional
    public void deleteArticle(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));

        articleRepository.deleteById(id);
        log.info("Article supprimé: {} (Ref: {})", article.getArticle(), article.getRef());
    }

    private ArticleResponse mapToResponse(Article article) {
        // Mapper les clients
        List<String> clientNames = article.getArticleClients().stream()
                .map(ac -> ac.getClient().getNomComplet())
                .collect(Collectors.toList());

        // Mapper les process
        List<ProcessDetailDTO> processDetails = article.getArticleProcesses().stream()
                .map(ap -> ProcessDetailDTO.builder()
                        .id("process-" + ap.getProcess().getId())
                        .name(ap.getProcess().getNom())
                        .tempsParPF(ap.getTempsParPF())
                        .cadenceMax(ap.getCadenceMax())
                        .build())
                .collect(Collectors.toList());

        return ArticleResponse.builder()
                .id(article.getId())
                .ref(article.getRef())
                .article(article.getArticle())
                .famille(article.getFamille())
                .sousFamille(article.getSousFamille())
                .typeProcess(article.getTypeProcess())
                .typeProduit(article.getTypeProduit())
                .prixUnitaire(article.getPrixUnitaire())
                .mpq(article.getMpq())
                .clients(clientNames)
                .processes(processDetails)
                .isActive(article.getIsActive())
                .createdAt(article.getCreatedAt().format(formatter))
                .updatedAt(article.getUpdatedAt().format(formatter))
                .build();
    }
}