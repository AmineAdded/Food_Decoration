package com.eleonetech.app.service;

import com.eleonetech.app.dto.*;
import com.eleonetech.app.entity.Article;
import com.eleonetech.app.entity.Client;
import com.eleonetech.app.entity.Commande;
import com.eleonetech.app.repository.ArticleRepository;
import com.eleonetech.app.repository.ClientRepository;
import com.eleonetech.app.repository.CommandeRepository;
import com.eleonetech.app.repository.LivraisonRepository;
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
public class CommandeService {

    private final CommandeRepository commandeRepository;
    private final ArticleRepository articleRepository;
    private final ClientRepository clientRepository;
    private final LivraisonRepository livraisonRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public CommandeResponse createCommande(CreateCommandeRequest request) {
        Article article = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        Client client = clientRepository.findByNomComplet(request.getClientNom())
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + request.getClientNom()));

        LocalDate dateSouhaitee = LocalDate.parse(request.getDateSouhaitee(), DATE_FORMATTER);

        // ✅ Créer la commande avec IDs et données dénormalisées
        Commande commande = Commande.builder()
                .articleId(article.getId())
                .articleRef(article.getRef())
                .articleNom(article.getArticle())
                .clientId(client.getId())
                .clientNom(client.getNomComplet())
                .numeroCommandeClient(request.getNumeroCommandeClient())
                .typeCommande(request.getTypeCommande())
                .quantite(request.getQuantite())
                .dateSouhaitee(dateSouhaitee)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        commande = commandeRepository.save(commande);

        log.info("Commande créée: {} unités de {} pour {} le {}",
                request.getQuantite(), article.getArticle(), client.getNomComplet(), dateSouhaitee);

        // Charger les objets pour la réponse
        commande.setArticle(article);
        commande.setClient(client);
        return mapToResponse(commande);
    }

    public List<CommandeResponse> getAllCommandes() {
        return commandeRepository.findAllActiveWithDetails()
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public CommandeResponse getCommandeById(String id) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        return loadEntitiesAndMap(commande);
    }

    public List<CommandeResponse> searchByArticleRef(String articleRef) {
        return commandeRepository.findByArticleRef(articleRef)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByClientNom(String clientNom) {
        return commandeRepository.findByClientNom(clientNom)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByDateSouhaitee(String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        return commandeRepository.findByDateSouhaitee(localDate)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByDateAjout(String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        LocalDateTime startOfDay = localDate.atStartOfDay();
        LocalDateTime endOfDay = localDate.plusDays(1).atStartOfDay();

        return commandeRepository.findByCreatedAtBetweenAndIsActiveTrue(startOfDay, endOfDay)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByArticleRefAndDateSouhaitee(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        return commandeRepository.findByArticleRefAndDateSouhaitee(articleRef, localDate)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByArticleRefAndDateAjout(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        LocalDateTime startOfDay = localDate.atStartOfDay();
        LocalDateTime endOfDay = localDate.plusDays(1).atStartOfDay();

        return commandeRepository.findByArticleRefAndCreatedAtBetweenAndIsActiveTrue(articleRef, startOfDay, endOfDay)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByArticleRefAndPeriodeSouhaitee(String articleRef, String dateDebut, String dateFin) {
        LocalDate debut = LocalDate.parse(dateDebut, DATE_FORMATTER);
        LocalDate fin = LocalDate.parse(dateFin, DATE_FORMATTER);
        return commandeRepository.findByArticleRefAndPeriodeSouhaitee(articleRef, debut, fin)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<CommandeResponse> searchByArticleRefAndPeriodeAjout(String articleRef, String dateDebut, String dateFin) {
        LocalDate debut = LocalDate.parse(dateDebut, DATE_FORMATTER);
        LocalDate fin = LocalDate.parse(dateFin, DATE_FORMATTER);
        LocalDateTime startOfDay = debut.atStartOfDay();
        LocalDateTime endOfDay = fin.plusDays(1).atStartOfDay();

        return commandeRepository.findByArticleRefAndCreatedAtBetweenAndIsActiveTrue(articleRef, startOfDay, endOfDay)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public CommandeSummaryResponse getSummaryByArticleRef(String articleRef) {
        List<Commande> commandes = commandeRepository.findByArticleRef(articleRef);
        return calculateSummary(commandes);
    }

    public CommandeSummaryResponse getSummaryByArticleRefAndDateSouhaitee(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        List<Commande> commandes = commandeRepository.findByArticleRefAndDateSouhaitee(articleRef, localDate);
        return calculateSummary(commandes);
    }

    public CommandeSummaryResponse getSummaryByArticleRefAndDateAjout(String articleRef, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        LocalDateTime startOfDay = localDate.atStartOfDay();
        LocalDateTime endOfDay = localDate.plusDays(1).atStartOfDay();

        List<Commande> commandes = commandeRepository.findByArticleRefAndCreatedAtBetweenAndIsActiveTrue(articleRef, startOfDay, endOfDay);
        return calculateSummary(commandes);
    }

    public CommandeSummaryResponse getSummaryByArticleRefAndPeriodeSouhaitee(String articleRef, String dateDebut, String dateFin) {
        LocalDate debut = LocalDate.parse(dateDebut, DATE_FORMATTER);
        LocalDate fin = LocalDate.parse(dateFin, DATE_FORMATTER);
        List<Commande> commandes = commandeRepository.findByArticleRefAndPeriodeSouhaitee(articleRef, debut, fin);
        return calculateSummary(commandes);
    }

    public CommandeSummaryResponse getSummaryByArticleRefAndPeriodeAjout(String articleRef, String dateDebut, String dateFin) {
        LocalDate debut = LocalDate.parse(dateDebut, DATE_FORMATTER);
        LocalDate fin = LocalDate.parse(dateFin, DATE_FORMATTER);
        LocalDateTime startOfDay = debut.atStartOfDay();
        LocalDateTime endOfDay = fin.plusDays(1).atStartOfDay();

        List<Commande> commandes = commandeRepository.findByArticleRefAndCreatedAtBetweenAndIsActiveTrue(articleRef, startOfDay, endOfDay);
        return calculateSummary(commandes);
    }

    public List<CommandeResponse> getCommandesForExport(String articleRef, String dateType,
                                                        String date, String dateDebut, String dateFin) {
        if (articleRef != null && dateDebut != null && dateFin != null) {
            if ("souhaitee".equals(dateType)) {
                return searchByArticleRefAndPeriodeSouhaitee(articleRef, dateDebut, dateFin);
            } else {
                return searchByArticleRefAndPeriodeAjout(articleRef, dateDebut, dateFin);
            }
        }

        if (articleRef != null && date != null) {
            if ("souhaitee".equals(dateType)) {
                return searchByArticleRefAndDateSouhaitee(articleRef, date);
            } else {
                return searchByArticleRefAndDateAjout(articleRef, date);
            }
        }

        if (articleRef != null) {
            return searchByArticleRef(articleRef);
        }

        if (date != null) {
            if ("souhaitee".equals(dateType)) {
                return searchByDateSouhaitee(date);
            } else {
                return searchByDateAjout(date);
            }
        }

        return getAllCommandes();
    }

    @Transactional
    public CommandeResponse updateCommande(String id, UpdateCommandeRequest request) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        Article article = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        Client client = clientRepository.findByNomComplet(request.getClientNom())
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + request.getClientNom()));

        LocalDate dateSouhaitee = LocalDate.parse(request.getDateSouhaitee(), DATE_FORMATTER);

        // ✅ Mettre à jour avec IDs et données dénormalisées
        commande.setArticleId(article.getId());
        commande.setArticleRef(article.getRef());
        commande.setArticleNom(article.getArticle());
        commande.setClientId(client.getId());
        commande.setClientNom(client.getNomComplet());
        commande.setQuantite(request.getQuantite());
        commande.setDateSouhaitee(dateSouhaitee);
        commande.setNumeroCommandeClient(request.getNumeroCommandeClient());
        commande.setTypeCommande(request.getTypeCommande());
        commande.setUpdatedAt(LocalDateTime.now());

        commande = commandeRepository.save(commande);

        log.info("Commande mise à jour: ID {}", id);

        commande.setArticle(article);
        commande.setClient(client);
        return mapToResponse(commande);
    }

    @Transactional
    public void deleteCommande(String id) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        commandeRepository.deleteById(id);
        log.info("Commande supprimée: ID {}", id);
    }

    // ============ MÉTHODES PRIVÉES ============

    private CommandeSummaryResponse calculateSummary(List<Commande> commandes) {
        int total = 0;
        int ferme = 0;
        int planifiee = 0;

        for (Commande commande : commandes) {
            total += commande.getQuantite();
            if ("FERME".equals(commande.getTypeCommande())) {
                ferme += commande.getQuantite();
            } else if ("PLANIFIEE".equals(commande.getTypeCommande())) {
                planifiee += commande.getQuantite();
            }
        }

        return CommandeSummaryResponse.builder()
                .totalQuantite(total)
                .quantiteFerme(ferme)
                .quantitePlanifiee(planifiee)
                .nombreCommandes(commandes.size())
                .build();
    }

    private CommandeResponse loadEntitiesAndMap(Commande commande) {
        // Charger article et client si pas déjà présents
        if (commande.getArticle() == null) {
            Article article = articleRepository.findById(commande.getArticleId())
                    .orElseThrow(() -> new RuntimeException("Article non trouvé"));
            commande.setArticle(article);
        }

        if (commande.getClient() == null) {
            Client client = clientRepository.findById(commande.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));
            commande.setClient(client);
        }

        return mapToResponse(commande);
    }

    private CommandeResponse mapToResponse(Commande commande) {
        // Utiliser les données dénormalisées si les objets ne sont pas chargés
        String articleRef = commande.getArticle() != null ?
                commande.getArticle().getRef() : commande.getArticleRef();
        String articleNom = commande.getArticle() != null ?
                commande.getArticle().getArticle() : commande.getArticleNom();
        String clientNom = commande.getClient() != null ?
                commande.getClient().getNomComplet() : commande.getClientNom();

        // Calculer la quantité livrée
        Integer quantiteLivree = livraisonRepository.sumQuantiteLivreeByCommandeId(commande.getId());
        if (quantiteLivree == null) quantiteLivree = 0;

        Integer quantiteNonLivree = commande.getQuantite() - quantiteLivree;

        return CommandeResponse.builder()
                .id(commande.getId())
                .articleRef(articleRef)
                .articleNom(articleNom)
                .clientNom(clientNom)
                .numeroCommandeClient(commande.getNumeroCommandeClient())
                .quantite(commande.getQuantite())
                .quantiteLivree(quantiteLivree)
                .quantiteNonLivree(quantiteNonLivree)
                .typeCommande(commande.getTypeCommande())
                .dateSouhaitee(commande.getDateSouhaitee().format(DATE_FORMATTER))
                .dateAjout(commande.getCreatedAt().toLocalDate().format(DATE_FORMATTER))
                .isActive(commande.getIsActive())
                .createdAt(commande.getCreatedAt().format(DATETIME_FORMATTER))
                .updatedAt(commande.getUpdatedAt().format(DATETIME_FORMATTER))
                .build();
    }
}