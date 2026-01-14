package com.eleonetech.app.service;

import com.eleonetech.app.dto.ArticleResponse;
import com.eleonetech.app.dto.CreateArticleRequest;
import com.eleonetech.app.dto.ProcessDetailDTO;
import com.eleonetech.app.dto.UpdateArticleRequest;
import com.eleonetech.app.entity.Article;
import com.eleonetech.app.entity.Client;
import com.eleonetech.app.entity.Process;
import com.eleonetech.app.repository.ArticleRepository;
import com.eleonetech.app.repository.ClientRepository;
import com.eleonetech.app.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
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
    private final FileStorageService fileStorageService;

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
                .stock(request.getStock() != null ? request.getStock() : 0)
               // .imageFilename(request.getImageFilename())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .clients(new ArrayList<>())
                .processes(new ArrayList<>())
                .build();

        // Ajouter les clients
        if (request.getClients() != null && !request.getClients().isEmpty()) {
            for (String clientNom : request.getClients()) {
                Client client = clientRepository.findByNomComplet(clientNom)
                        .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientNom));
                article.addClient(client);
            }
        }

        // Ajouter les process
        if (request.getProcesses() != null && !request.getProcesses().isEmpty()) {
            for (ProcessDetailDTO processDetail : request.getProcesses()) {
                Process process = processRepository.findByNom(processDetail.getName())
                        .orElseThrow(() -> new RuntimeException("Process non trouvé: " + processDetail.getName()));

                article.addProcess(process, processDetail.getTempsParPF(), processDetail.getCadenceMax());
            }
        }

        article = articleRepository.save(article);
        log.info("Article créé: {} (Ref: {})", article.getArticle(), article.getRef());

        return mapToResponse(article);
    }

    public List<ArticleResponse> getAllArticles() {
        List<Article> articles = articleRepository.findAllActiveWithClients();
        return articles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ArticleResponse getArticleById(String id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));
        return mapToResponse(article);
    }

    @Transactional
    public ArticleResponse updateArticle(String id, UpdateArticleRequest request) {
        Article article = articleRepository.findById(id)
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
        article.setStock(request.getStock() != null ? request.getStock() : article.getStock());
        article.setUpdatedAt(LocalDateTime.now());

        // Mettre à jour les clients
        article.getClients().clear();
        if (request.getClients() != null && !request.getClients().isEmpty()) {
            for (String clientNom : request.getClients()) {
                Client client = clientRepository.findByNomComplet(clientNom)
                        .orElseThrow(() -> new RuntimeException("Client non trouvé: " + clientNom));
                article.addClient(client);
            }
        }

        // Mettre à jour les process
        article.getProcesses().clear();
        if (request.getProcesses() != null && !request.getProcesses().isEmpty()) {
            for (ProcessDetailDTO processDetail : request.getProcesses()) {
                Process process = processRepository.findByNom(processDetail.getName())
                        .orElseThrow(() -> new RuntimeException("Process non trouvé: " + processDetail.getName()));

                article.addProcess(process, processDetail.getTempsParPF(), processDetail.getCadenceMax());
            }
        }

        article = articleRepository.save(article);
        log.info("Article mis à jour: {} (Ref: {})", article.getArticle(), article.getRef());

        return mapToResponse(article);
    }

    @Transactional
    public ArticleResponse updateArticleImage(String id, MultipartFile file) throws IOException {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));

        // Supprimer l'ancienne image si elle existe
        if (article.getImageFilename() != null) {
            fileStorageService.deleteImage(article.getImageFilename());
        }

        // Sauvegarder la nouvelle image
        String filename = fileStorageService.saveImage(file);
        article.setImageFilename(filename);
        article.setUpdatedAt(LocalDateTime.now());

        article = articleRepository.save(article);
        log.info("Image mise à jour pour l'article: {} -> {}", article.getRef(), filename);

        return mapToResponse(article);
    }

    @Transactional
    public void deleteArticleImage(String id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));

        if (article.getImageFilename() != null) {
            fileStorageService.deleteImage(article.getImageFilename());
            article.setImageFilename(null);
            article.setUpdatedAt(LocalDateTime.now());
            articleRepository.save(article);
            log.info("Image supprimée pour l'article: {}", article.getRef());
        }
    }

    @Transactional
    public void deleteArticle(String id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));

        // Supprimer l'image si elle existe
        if (article.getImageFilename() != null) {
            fileStorageService.deleteImage(article.getImageFilename());
        }

        articleRepository.deleteById(id);
        log.info("Article supprimé: {} (Ref: {})", article.getArticle(), article.getRef());
    }

    public List<String> getDistinctRefs() {
        return articleRepository.findAll()
                .stream()
                .filter(Article::getIsActive)
                .map(Article::getRef)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<String> getDistinctNoms() {
        return articleRepository.findAll()
                .stream()
                .filter(Article::getIsActive)
                .map(Article::getArticle)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<String> getDistinctFamilles() {
        return articleRepository.findAll()
                .stream()
                .filter(Article::getIsActive)
                .filter(a -> a.getFamille() != null && !a.getFamille().isEmpty())
                .map(Article::getFamille)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<String> getDistinctTypeProduits() {
        return articleRepository.findAll()
                .stream()
                .filter(Article::getIsActive)
                .filter(a -> a.getTypeProduit() != null && !a.getTypeProduit().isEmpty())
                .map(Article::getTypeProduit)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<String> getDistinctTypeProcess() {
        return articleRepository.findAll()
                .stream()
                .filter(Article::getIsActive)
                .filter(a -> a.getTypeProcess() != null && !a.getTypeProcess().isEmpty())
                .map(Article::getTypeProcess)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<ArticleResponse> searchByRef(String ref) {
        List<Article> articles = articleRepository.findByRefWithClients(ref);
        return articles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ArticleResponse> searchByNom(String nom) {
        List<Article> articles = articleRepository.findByNomWithClients(nom);
        return articles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ArticleResponse> searchByFamille(String famille) {
        List<Article> articles = articleRepository.findByFamilleWithClients(famille);
        return articles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ArticleResponse> searchByTypeProduit(String typeProduit) {
        List<Article> articles = articleRepository.findByTypeProduitWithClients(typeProduit);
        return articles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ArticleResponse> searchByTypeProcess(String typeProcess) {
        List<Article> articles = articleRepository.findByTypeProcessWithClients(typeProcess);
        return articles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ArticleResponse mapToResponse(Article article) {
        List<String> clientNames = article.getClients().stream()
                .map(Client::getNomComplet)
                .collect(Collectors.toList());

        List<ProcessDetailDTO> processDetails = article.getProcesses().stream()
                .map(ap -> ProcessDetailDTO.builder()
                        .id(ap.getProcess().getId())
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
                .stock(article.getStock())
                .imageFilename(article.getImageFilename())
                .clients(clientNames)
                .processes(processDetails)
                .isActive(article.getIsActive())
                .createdAt(article.getCreatedAt() != null ? article.getCreatedAt().format(formatter) : null)
                .updatedAt(article.getUpdatedAt() != null ? article.getUpdatedAt().format(formatter) : null)
                .build();
    }
}