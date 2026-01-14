// backend/src/main/java/com/eleonetech/app/controller/CommandeController.java
package com.eleonetech.app.controller;

import com.eleonetech.app.dto.*;
import com.eleonetech.app.service.CommandeService;
import com.eleonetech.app.service.ExcelExportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}")
@Slf4j
public class CommandeController {

    private final CommandeService commandeService;
    private final ExcelExportService excelExportService;

    @PostMapping
    public ResponseEntity<?> createCommande(@Valid @RequestBody CreateCommandeRequest request) {
        try {
            CommandeResponse response = commandeService.createCommande(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de la commande: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<CommandeResponse>> getAllCommandes() {
        List<CommandeResponse> commandes = commandeService.getAllCommandes();
        return ResponseEntity.ok(commandes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCommandeById(@PathVariable String id) {
        try {
            CommandeResponse response = commandeService.getCommandeById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la récupération de la commande: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/search/article/{articleRef}")
    public ResponseEntity<List<CommandeResponse>> searchByArticleRef(@PathVariable String articleRef) {
        List<CommandeResponse> commandes = commandeService.searchByArticleRef(articleRef);
        return ResponseEntity.ok(commandes);
    }

    @GetMapping("/search/client/{clientNom}")
    public ResponseEntity<List<CommandeResponse>> searchByClientNom(@PathVariable String clientNom) {
        List<CommandeResponse> commandes = commandeService.searchByClientNom(clientNom);
        return ResponseEntity.ok(commandes);
    }

    @GetMapping("/search/date-souhaitee/{date}")
    public ResponseEntity<List<CommandeResponse>> searchByDateSouhaitee(@PathVariable String date) {
        List<CommandeResponse> commandes = commandeService.searchByDateSouhaitee(date);
        return ResponseEntity.ok(commandes);
    }

    @GetMapping("/search/date-ajout/{date}")
    public ResponseEntity<List<CommandeResponse>> searchByDateAjout(@PathVariable String date) {
        List<CommandeResponse> commandes = commandeService.searchByDateAjout(date);
        return ResponseEntity.ok(commandes);
    }

    // ✅ NOUVEAU: Recherche par période
    @GetMapping("/search/article/{articleRef}/periode-souhaitee")
    public ResponseEntity<List<CommandeResponse>> searchByArticleRefAndPeriodeSouhaitee(
            @PathVariable String articleRef,
            @RequestParam String dateDebut,
            @RequestParam String dateFin) {
        List<CommandeResponse> commandes = commandeService.searchByArticleRefAndPeriodeSouhaitee(articleRef, dateDebut, dateFin);
        return ResponseEntity.ok(commandes);
    }

    @GetMapping("/search/article/{articleRef}/periode-ajout")
    public ResponseEntity<List<CommandeResponse>> searchByArticleRefAndPeriodeAjout(
            @PathVariable String articleRef,
            @RequestParam String dateDebut,
            @RequestParam String dateFin) {
        List<CommandeResponse> commandes = commandeService.searchByArticleRefAndPeriodeAjout(articleRef, dateDebut, dateFin);
        return ResponseEntity.ok(commandes);
    }

    @GetMapping("/search/article/{articleRef}/date-souhaitee/{date}")
    public ResponseEntity<List<CommandeResponse>> searchByArticleRefAndDateSouhaitee(
            @PathVariable String articleRef,
            @PathVariable String date) {
        List<CommandeResponse> commandes = commandeService.searchByArticleRefAndDateSouhaitee(articleRef, date);
        return ResponseEntity.ok(commandes);
    }

    @GetMapping("/search/article/{articleRef}/date-ajout/{date}")
    public ResponseEntity<List<CommandeResponse>> searchByArticleRefAndDateAjout(
            @PathVariable String articleRef,
            @PathVariable String date) {
        List<CommandeResponse> commandes = commandeService.searchByArticleRefAndDateAjout(articleRef, date);
        return ResponseEntity.ok(commandes);
    }

    // Endpoints pour les sommaires - uniquement pour article seul ou article + date/période
    @GetMapping("/summary/article/{articleRef}")
    public ResponseEntity<CommandeSummaryResponse> getSummaryByArticleRef(@PathVariable String articleRef) {
        CommandeSummaryResponse summary = commandeService.getSummaryByArticleRef(articleRef);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/summary/article/{articleRef}/date-souhaitee/{date}")
    public ResponseEntity<CommandeSummaryResponse> getSummaryByArticleRefAndDateSouhaitee(
            @PathVariable String articleRef,
            @PathVariable String date) {
        CommandeSummaryResponse summary = commandeService.getSummaryByArticleRefAndDateSouhaitee(articleRef, date);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/summary/article/{articleRef}/date-ajout/{date}")
    public ResponseEntity<CommandeSummaryResponse> getSummaryByArticleRefAndDateAjout(
            @PathVariable String articleRef,
            @PathVariable String date) {
        CommandeSummaryResponse summary = commandeService.getSummaryByArticleRefAndDateAjout(articleRef, date);
        return ResponseEntity.ok(summary);
    }

    // ✅ NOUVEAU: Sommaires pour les périodes
    @GetMapping("/summary/article/{articleRef}/periode-souhaitee")
    public ResponseEntity<CommandeSummaryResponse> getSummaryByArticleRefAndPeriodeSouhaitee(
            @PathVariable String articleRef,
            @RequestParam String dateDebut,
            @RequestParam String dateFin) {
        CommandeSummaryResponse summary = commandeService.getSummaryByArticleRefAndPeriodeSouhaitee(articleRef, dateDebut, dateFin);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/summary/article/{articleRef}/periode-ajout")
    public ResponseEntity<CommandeSummaryResponse> getSummaryByArticleRefAndPeriodeAjout(
            @PathVariable String articleRef,
            @RequestParam String dateDebut,
            @RequestParam String dateFin) {
        CommandeSummaryResponse summary = commandeService.getSummaryByArticleRefAndPeriodeAjout(articleRef, dateDebut, dateFin);
        return ResponseEntity.ok(summary);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCommande(
            @PathVariable String id,
            @Valid @RequestBody UpdateCommandeRequest request) {
        try {
            CommandeResponse response = commandeService.updateCommande(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la mise à jour de la commande: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCommande(@PathVariable String id) {
        try {
            commandeService.deleteCommande(id);
            return ResponseEntity.ok(new MessageResponse("Commande supprimée avec succès"));
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression de la commande: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    // ✅ NOUVEAU: Export Excel
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) String articleRef,
            @RequestParam(required = false) String dateType,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {
        try {
            List<CommandeResponse> commandes = commandeService.getCommandesForExport(
                    articleRef, dateType, date, dateDebut, dateFin);

            byte[] excelFile = excelExportService.exportCommandesToExcel(commandes);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment",
                    "commandes_" + LocalDate.now() + ".xlsx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelFile);

        } catch (Exception e) {
            log.error("Erreur lors de l'export Excel: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/etat-commandes")
    public ResponseEntity<byte[]> exportEtatCommandes(
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {
        try {
            log.info("📊 Export état commandes - Mode: {}", mode);

            // Déterminer la période
            String periode;
            LocalDate debut;
            LocalDate fin;

            if ("month".equals(mode) && year != null && month != null) {
                // Mode mois
                debut = LocalDate.of(year, month, 1);
                fin = debut.withDayOfMonth(debut.lengthOfMonth());

                String[] monthNames = {"Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"};
                periode = monthNames[month - 1] + " " + year;

            } else if ("period".equals(mode) && dateDebut != null && dateFin != null) {
                // Mode période
                debut = LocalDate.parse(dateDebut);
                fin = LocalDate.parse(dateFin);

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                periode = "Du " + debut.format(formatter) + " au " + fin.format(formatter);

            } else {
                // Par défaut : mois en cours
                debut = LocalDate.now().withDayOfMonth(1);
                fin = debut.withDayOfMonth(debut.lengthOfMonth());

                String[] monthNames = {"Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"};
                periode = monthNames[debut.getMonthValue() - 1] + " " + debut.getYear();
            }

            log.info("📅 Période: {} ({} au {})", periode, debut, fin);

            // Récupérer toutes les commandes
            List<CommandeResponse> allCommandes = commandeService.getAllCommandes();

            // Filtrer par période
            String finalDebut = debut.toString();
            String finalFin = fin.toString();
            List<CommandeResponse> filteredCommandes = allCommandes.stream()
                    .filter(cmd -> {
                        String dateSouhaitee = cmd.getDateSouhaitee();
                        return dateSouhaitee.compareTo(finalDebut) >= 0
                                && dateSouhaitee.compareTo(finalFin) <= 0;
                    })
                    .collect(Collectors.toList());

            log.info("📦 Commandes filtrées: {}", filteredCommandes.size());

            // Calculer les statistiques par client
            Map<String, ExcelExportService.ClientStat> clientStats = new HashMap<>();

            for (CommandeResponse cmd : filteredCommandes) {
                String clientNom = cmd.getClientNom();

                ExcelExportService.ClientStat stat = clientStats.get(clientNom);
                if (stat == null) {
                    stat = new ExcelExportService.ClientStat(clientNom, 0, 0, 0, 0);
                    clientStats.put(clientNom, stat);
                }

                stat.quantiteTotale += cmd.getQuantite();
                stat.nombreCommandes++;

                if ("FERME".equals(cmd.getTypeCommande())) {
                    stat.quantiteFerme += cmd.getQuantite();
                } else {
                    stat.quantitePlanifiee += cmd.getQuantite();
                }
            }

            // Calculer les totaux
            ExcelExportService.TotalStats totalStats = new ExcelExportService.TotalStats(
                    clientStats.values().stream().mapToLong(s -> s.quantiteTotale).sum(),
                    clientStats.values().stream().mapToLong(s -> s.quantiteFerme).sum(),
                    clientStats.values().stream().mapToLong(s -> s.quantitePlanifiee).sum(),
                    clientStats.values().stream().mapToInt(s -> s.nombreCommandes).sum(),
                    clientStats.size()
            );

            log.info("📊 Stats - Clients: {}, Total: {}, Ferme: {}, Planifiée: {}",
                    totalStats.nombreClients, totalStats.totalQuantite,
                    totalStats.totalFerme, totalStats.totalPlanifiee);

            // Générer l'Excel
            byte[] excelFile = excelExportService.exportEtatCommandesToExcel(
                    filteredCommandes, periode, clientStats, totalStats);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment",
                    "etat_commandes_" + LocalDate.now() + ".xlsx");

            log.info("✅ Export Excel généré avec succès");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelFile);

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'export Excel: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}