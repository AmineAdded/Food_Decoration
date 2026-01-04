// backend/src/main/java/com/eleonetech/app/service/CommandeService.java
package com.eleonetech.app.service;

import com.eleonetech.app.dto.*;
import com.eleonetech.app.entity.Article;
import com.eleonetech.app.entity.Client;
import com.eleonetech.app.entity.Commande;
import com.eleonetech.app.repository.ArticleRepository;
import com.eleonetech.app.repository.ClientRepository;
import com.eleonetech.app.repository.CommandeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommandeService {

    private final CommandeRepository commandeRepository;
    private final ArticleRepository articleRepository;
    private final ClientRepository clientRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public CommandeResponse createCommande(CreateCommandeRequest request) {
        Article article = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        Client client = clientRepository.findByNomComplet(request.getClientNom())
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + request.getClientNom()));

        LocalDate dateSouhaitee = LocalDate.parse(request.getDateSouhaitee(), DATE_FORMATTER);

        Commande commande = Commande.builder()
                .article(article)
                .client(client)
                .quantite(request.getQuantite())
                .dateSouhaitee(dateSouhaitee)
                .isActive(true)
                .build();

        commande = commandeRepository.save(commande);

        log.info("Commande créée: {} unités de {} pour {} le {}",
                request.getQuantite(), article.getArticle(), client.getNomComplet(), dateSouhaitee);

        return mapToResponse(commande);
    }

    public List<CommandeResponse> getAllCommandes() {
        return commandeRepository.findAllActiveWithDetails()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CommandeResponse getCommandeById(Long id) {
        Commande commande = commandeRepository.findByIdWithDetails(id);
        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }
        return mapToResponse(commande);
    }

    public List<CommandeResponse> searchByArticleRef(String articleRef) {
        return commandeRepository.findByArticleRef(articleRef)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByClientNom(String clientNom) {
        return commandeRepository.findByClientNom(clientNom)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByDateSouhaitee(String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        return commandeRepository.findByDateSouhaitee(localDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByDateAjout(String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        return commandeRepository.findByDateAjout(localDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByArticleRefAndDateSouhaitee(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        return commandeRepository.findByArticleRefAndDateSouhaitee(articleRef, localDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByArticleRefAndDateAjout(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        return commandeRepository.findByArticleRefAndDateAjout(articleRef, localDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ✅ NOUVEAU: Recherche par période
    public List<CommandeResponse> searchByArticleRefAndPeriodeSouhaitee(String articleRef, String dateDebut, String dateFin) {
        LocalDate debut = LocalDate.parse(dateDebut, DATE_FORMATTER);
        LocalDate fin = LocalDate.parse(dateFin, DATE_FORMATTER);
        return commandeRepository.findByArticleRefAndPeriodeSouhaitee(articleRef, debut, fin)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByArticleRefAndPeriodeAjout(String articleRef, String dateDebut, String dateFin) {
        LocalDate debut = LocalDate.parse(dateDebut, DATE_FORMATTER);
        LocalDate fin = LocalDate.parse(dateFin, DATE_FORMATTER);
        return commandeRepository.findByArticleRefAndPeriodeAjout(articleRef, debut, fin)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Sommaires - uniquement pour article seul ou article + date/période
    public CommandeSummaryResponse getSummaryByArticleRef(String articleRef) {
        List<Commande> commandes = commandeRepository.findByArticleRef(articleRef);
        Integer total = commandeRepository.sumQuantiteByArticleRef(articleRef);
        return CommandeSummaryResponse.builder()
                .totalQuantite(total != null ? total : 0)
                .nombreCommandes(commandes.size())
                .build();
    }

    public CommandeSummaryResponse getSummaryByArticleRefAndDateSouhaitee(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        List<Commande> commandes = commandeRepository.findByArticleRefAndDateSouhaitee(articleRef, localDate);
        Integer total = commandeRepository.sumQuantiteByArticleRefAndDateSouhaitee(articleRef, localDate);
        return CommandeSummaryResponse.builder()
                .totalQuantite(total != null ? total : 0)
                .nombreCommandes(commandes.size())
                .build();
    }

    public CommandeSummaryResponse getSummaryByArticleRefAndDateAjout(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        List<Commande> commandes = commandeRepository.findByArticleRefAndDateAjout(articleRef, localDate);
        Integer total = commandeRepository.sumQuantiteByArticleRefAndDateAjout(articleRef, localDate);
        return CommandeSummaryResponse.builder()
                .totalQuantite(total != null ? total : 0)
                .nombreCommandes(commandes.size())
                .build();
    }

    // ✅ NOUVEAU: Sommaires pour les périodes
    public CommandeSummaryResponse getSummaryByArticleRefAndPeriodeSouhaitee(String articleRef, String dateDebut, String dateFin) {
        LocalDate debut = LocalDate.parse(dateDebut, DATE_FORMATTER);
        LocalDate fin = LocalDate.parse(dateFin, DATE_FORMATTER);
        List<Commande> commandes = commandeRepository.findByArticleRefAndPeriodeSouhaitee(articleRef, debut, fin);
        Integer total = commandeRepository.sumQuantiteByArticleRefAndPeriodeSouhaitee(articleRef, debut, fin);
        return CommandeSummaryResponse.builder()
                .totalQuantite(total != null ? total : 0)
                .nombreCommandes(commandes.size())
                .build();
    }

    public CommandeSummaryResponse getSummaryByArticleRefAndPeriodeAjout(String articleRef, String dateDebut, String dateFin) {
        LocalDate debut = LocalDate.parse(dateDebut, DATE_FORMATTER);
        LocalDate fin = LocalDate.parse(dateFin, DATE_FORMATTER);
        List<Commande> commandes = commandeRepository.findByArticleRefAndPeriodeAjout(articleRef, debut, fin);
        Integer total = commandeRepository.sumQuantiteByArticleRefAndPeriodeAjout(articleRef, debut, fin);
        return CommandeSummaryResponse.builder()
                .totalQuantite(total != null ? total : 0)
                .nombreCommandes(commandes.size())
                .build();
    }

    // ✅ NOUVEAU: Méthode pour récupérer les commandes selon les critères d'export
    public List<CommandeResponse> getCommandesForExport(String articleRef, String dateType,
                                                        String date, String dateDebut, String dateFin) {
        // Si on a une période
        if (articleRef != null && dateDebut != null && dateFin != null) {
            if ("souhaitee".equals(dateType)) {
                return searchByArticleRefAndPeriodeSouhaitee(articleRef, dateDebut, dateFin);
            } else {
                return searchByArticleRefAndPeriodeAjout(articleRef, dateDebut, dateFin);
            }
        }

        // Si on a article + date
        if (articleRef != null && date != null) {
            if ("souhaitee".equals(dateType)) {
                return searchByArticleRefAndDateSouhaitee(articleRef, date);
            } else {
                return searchByArticleRefAndDateAjout(articleRef, date);
            }
        }

        // Si on a seulement l'article
        if (articleRef != null) {
            return searchByArticleRef(articleRef);
        }

        // Si on a seulement une date
        if (date != null) {
            if ("souhaitee".equals(dateType)) {
                return searchByDateSouhaitee(date);
            } else {
                return searchByDateAjout(date);
            }
        }

        // Sinon, toutes les commandes
        return getAllCommandes();
    }

    @Transactional
    public CommandeResponse updateCommande(Long id, UpdateCommandeRequest request) {
        Commande commande = commandeRepository.findByIdWithDetails(id);
        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }

        Article article = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        Client client = clientRepository.findByNomComplet(request.getClientNom())
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + request.getClientNom()));

        LocalDate dateSouhaitee = LocalDate.parse(request.getDateSouhaitee(), DATE_FORMATTER);

        commande.setArticle(article);
        commande.setClient(client);
        commande.setQuantite(request.getQuantite());
        commande.setDateSouhaitee(dateSouhaitee);

        commande = commandeRepository.save(commande);

        log.info("Commande mise à jour: ID {}", id);

        return mapToResponse(commande);
    }

    @Transactional
    public void deleteCommande(Long id) {
        Commande commande = commandeRepository.findByIdWithDetails(id);
        if (commande == null) {
            throw new RuntimeException("Commande non trouvée");
        }

        commandeRepository.deleteById(id);
        log.info("Commande supprimée: ID {}", id);
    }

    private CommandeResponse mapToResponse(Commande commande) {
        return CommandeResponse.builder()
                .id(commande.getId())
                .articleRef(commande.getArticle().getRef())
                .articleNom(commande.getArticle().getArticle())
                .clientNom(commande.getClient().getNomComplet())
                .quantite(commande.getQuantite())
                .dateSouhaitee(commande.getDateSouhaitee().format(DATE_FORMATTER))
                .dateAjout(commande.getCreatedAt().toLocalDate().format(DATE_FORMATTER))
                .isActive(commande.getIsActive())
                .createdAt(commande.getCreatedAt().format(DATETIME_FORMATTER))
                .updatedAt(commande.getUpdatedAt().format(DATETIME_FORMATTER))
                .build();
    }
}