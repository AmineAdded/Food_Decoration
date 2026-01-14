package com.eleonetech.app.controller;

import com.eleonetech.app.dto.*;
import com.eleonetech.app.service.ArticleService;
import com.eleonetech.app.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}")
@Slf4j
public class ArticleController {

    private final ArticleService articleService;
    private final FileStorageService fileStorageService;

    @PostMapping
    public ResponseEntity<?> createArticle(@Valid @RequestBody CreateArticleRequest request) {
        try {
            ArticleResponse response = articleService.createArticle(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de l'article: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    // ✅ NOUVEAU: Upload d'image
    // backend/src/main/java/com/eleonetech/app/controller/ArticleController.java
    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadImage(
            @PathVariable String id,
            @RequestParam("image") MultipartFile file) {
        try {
            log.info("📤 Upload image pour article ID: {}", id);
            log.info("📄 Nom fichier: {}, Taille: {} bytes, Type: {}",
                    file.getOriginalFilename(), file.getSize(), file.getContentType());

            // ✅ Validation
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Le fichier est vide"));
            }

            ArticleResponse response = articleService.updateArticleImage(id, file);

            log.info("✅ Image uploadée avec succès: {}", response.getImageFilename());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'upload de l'image: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Erreur: " + e.getMessage()));
        }
    }

    // ✅ NOUVEAU: Récupération d'image
    @GetMapping("/image/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.getImagePath(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = "image/jpeg"; // Par défaut
                if (filename.toLowerCase().endsWith(".png")) {
                    contentType = "image/png";
                } else if (filename.toLowerCase().endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (filename.toLowerCase().endsWith(".webp")) {
                    contentType = "image/webp";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'image: ", e);
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ NOUVEAU: Suppression d'image
    @DeleteMapping("/{id}/image")
    public ResponseEntity<?> deleteImage(@PathVariable String id) {
        try {
            articleService.deleteArticleImage(id);
            return ResponseEntity.ok(new MessageResponse("Image supprimée avec succès"));
        } catch (Exception e) {
            log.error("Erreur lors de la suppression de l'image: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ArticleResponse>> getAllArticles() {
        List<ArticleResponse> articles = articleService.getAllArticles();
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getArticleById(@PathVariable String id) {
        try {
            ArticleResponse response = articleService.getArticleById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la récupération de l'article: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateArticle(
            @PathVariable String id,
            @Valid @RequestBody UpdateArticleRequest request) {
        try {
            ArticleResponse response = articleService.updateArticle(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la mise à jour de l'article: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArticle(@PathVariable String id) {
        try {
            articleService.deleteArticle(id);
            return ResponseEntity.ok(new MessageResponse("Article supprimé avec succès"));
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression de l'article: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }


    @GetMapping("/distinct-refs")
    public ResponseEntity<List<String>> getDistinctRefs() {
        List<String> refs = articleService.getDistinctRefs();
        return ResponseEntity.ok(refs);
    }

    @GetMapping("/distinct-noms")
    public ResponseEntity<List<String>> getDistinctNoms() {
        List<String> noms = articleService.getDistinctNoms();
        return ResponseEntity.ok(noms);
    }

    @GetMapping("/distinct-familles")
    public ResponseEntity<List<String>> getDistinctFamilles() {
        List<String> familles = articleService.getDistinctFamilles();
        return ResponseEntity.ok(familles);
    }

    @GetMapping("/distinct-type-produits")
    public ResponseEntity<List<String>> getDistinctTypeProduits() {
        List<String> types = articleService.getDistinctTypeProduits();
        return ResponseEntity.ok(types);
    }

    @GetMapping("/distinct-type-process")
    public ResponseEntity<List<String>> getDistinctTypeProcess() {
        List<String> types = articleService.getDistinctTypeProcess();
        return ResponseEntity.ok(types);
    }

    @GetMapping("/search/ref/{ref}")
    public ResponseEntity<List<ArticleResponse>> searchByRef(@PathVariable String ref) {
        List<ArticleResponse> articles = articleService.searchByRef(ref);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/search/nom/{nom}")
    public ResponseEntity<List<ArticleResponse>> searchByNom(@PathVariable String nom) {
        List<ArticleResponse> articles = articleService.searchByNom(nom);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/search/famille/{famille}")
    public ResponseEntity<List<ArticleResponse>> searchByFamille(@PathVariable String famille) {
        List<ArticleResponse> articles = articleService.searchByFamille(famille);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/search/type-produit/{typeProduit}")
    public ResponseEntity<List<ArticleResponse>> searchByTypeProduit(@PathVariable String typeProduit) {
        List<ArticleResponse> articles = articleService.searchByTypeProduit(typeProduit);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/search/type-process/{typeProcess}")
    public ResponseEntity<List<ArticleResponse>> searchByTypeProcess(@PathVariable String typeProcess) {
        List<ArticleResponse> articles = articleService.searchByTypeProcess(typeProcess);
        return ResponseEntity.ok(articles);
    }
}