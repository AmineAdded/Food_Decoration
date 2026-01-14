// backend/src/main/java/com/eleonetech/app/controller/LivraisonController.java
package com.eleonetech.app.controller;

import com.eleonetech.app.dto.*;
import com.eleonetech.app.service.ExcelExportService;
import com.eleonetech.app.service.LivraisonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/livraisons")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}")
@Slf4j
public class LivraisonController {

    private final LivraisonService livraisonService;
    private final ExcelExportService excelExportService;

    @PostMapping
    public ResponseEntity<?> createLivraison(@Valid @RequestBody CreateLivraisonRequest request) {
        try {
            LivraisonResponse response = livraisonService.createLivraison(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de la livraison: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<LivraisonResponse>> getAllLivraisons() {
        List<LivraisonResponse> livraisons = livraisonService.getAllLivraisons();
        return ResponseEntity.ok(livraisons);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLivraisonById(@PathVariable String id) {
        try {
            LivraisonResponse response = livraisonService.getLivraisonById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la récupération de la livraison: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/search/article/{articleRef}")
    public ResponseEntity<List<LivraisonResponse>> searchByArticleRef(@PathVariable String articleRef) {
        List<LivraisonResponse> livraisons = livraisonService.searchByArticleRef(articleRef);
        return ResponseEntity.ok(livraisons);
    }

    @GetMapping("/search/client/{clientNom}")
    public ResponseEntity<List<LivraisonResponse>> searchByClientNom(@PathVariable String clientNom) {
        List<LivraisonResponse> livraisons = livraisonService.searchByClientNom(clientNom);
        return ResponseEntity.ok(livraisons);
    }

    @GetMapping("/search/commande/{numeroCommande}")
    public ResponseEntity<List<LivraisonResponse>> searchByNumeroCommande(@PathVariable String numeroCommande) {
        List<LivraisonResponse> livraisons = livraisonService.searchByNumeroCommande(numeroCommande);
        return ResponseEntity.ok(livraisons);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLivraison(
            @PathVariable String id,
            @Valid @RequestBody UpdateLivraisonRequest request) {
        try {
            LivraisonResponse response = livraisonService.updateLivraison(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la mise à jour de la livraison: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLivraison(@PathVariable String id) {
        try {
            livraisonService.deleteLivraison(id);
            return ResponseEntity.ok(new MessageResponse("Livraison supprimée avec succès"));
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression de la livraison: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    // ✅ NOUVEAU: Export Excel pour les livraisons
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) String articleRef,
            @RequestParam(required = false) String clientNom,
            @RequestParam(required = false) String numeroCommande) {
        try {
            List<LivraisonResponse> livraisons;

            // Déterminer quelles livraisons exporter selon les filtres
            if (numeroCommande != null && !numeroCommande.isEmpty()) {
                livraisons = livraisonService.searchByNumeroCommande(numeroCommande);
            } else if (articleRef != null && !articleRef.isEmpty()) {
                livraisons = livraisonService.searchByArticleRef(articleRef);
            } else if (clientNom != null && !clientNom.isEmpty()) {
                livraisons = livraisonService.searchByClientNom(clientNom);
            } else {
                livraisons = livraisonService.getAllLivraisons();
            }

            byte[] excelFile = excelExportService.exportLivraisonsToExcel(livraisons);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment",
                    "livraisons_" + LocalDate.now() + ".xlsx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelFile);

        } catch (Exception e) {
            log.error("Erreur lors de l'export Excel: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}