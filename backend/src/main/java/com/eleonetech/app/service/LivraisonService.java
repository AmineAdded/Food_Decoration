package com.eleonetech.app.service;

import com.eleonetech.app.dto.*;
import com.eleonetech.app.entity.Article;
import com.eleonetech.app.entity.Client;
import com.eleonetech.app.entity.Commande;
import com.eleonetech.app.entity.Livraison;
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
public class LivraisonService {

    private final LivraisonRepository livraisonRepository;
    private final ArticleRepository articleRepository;
    private final ClientRepository clientRepository;
    private final CommandeRepository commandeRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public LivraisonResponse createLivraison(CreateLivraisonRequest request) {
        // Vérifier l'article
        Article article = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        // Vérifier le client
        Client client = clientRepository.findByNomComplet(request.getClientNom())
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + request.getClientNom()));

        // ✅ Trouver la commande avec les nouveaux champs
        List<Commande> commandes = commandeRepository.findByArticleRef(request.getArticleRef());
        Commande commande = commandes.stream()
                .filter(c -> c.getNumeroCommandeClient().equals(request.getNumeroCommandeClient()))
                .filter(c -> c.getClientNom().equals(request.getClientNom()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        // Vérifier le stock disponible
        if (article.getStock() < request.getQuantiteLivree()) {
            throw new RuntimeException("Stock insuffisant. Stock disponible: " + article.getStock());
        }

        // Vérifier qu'on ne dépasse pas la quantité commandée
        Integer quantiteDejaLivree = livraisonRepository.sumQuantiteLivreeByCommandeId(commande.getId());
        if (quantiteDejaLivree == null) quantiteDejaLivree = 0;

        int quantiteRestante = commande.getQuantite() - quantiteDejaLivree;
        if (request.getQuantiteLivree() > quantiteRestante) {
            throw new RuntimeException("Quantité trop élevée. Quantité restante à livrer: " + quantiteRestante);
        }

        LocalDate dateLivraison = LocalDate.parse(request.getDateLivraison(), DATE_FORMATTER);

        // Générer le numéro BL
        String numeroBL = generateNumeroBL(dateLivraison.getYear());

        // ✅ Créer la livraison avec IDs et données dénormalisées
        Livraison livraison = Livraison.builder()
                .numeroBL(numeroBL)
                .articleId(article.getId())
                .articleRef(article.getRef())
                .articleNom(article.getArticle())
                .clientId(client.getId())
                .clientNom(client.getNomComplet())
                .commandeId(commande.getId())
                .numeroCommandeClient(commande.getNumeroCommandeClient())
                .quantiteLivree(request.getQuantiteLivree())
                .dateLivraison(dateLivraison)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        livraison = livraisonRepository.save(livraison);

        // Déduire du stock
        article.setStock(article.getStock() - request.getQuantiteLivree());
        article.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(article);

        // Vérifier si la commande est totalement livrée
        Integer totalLivre = livraisonRepository.sumQuantiteLivreeByCommandeId(commande.getId());
        if (totalLivre != null && totalLivre >= commande.getQuantite()) {
            commande.setIsActive(false);
            commande.setUpdatedAt(LocalDateTime.now());
            commandeRepository.save(commande);
            log.info("Commande {} totalement livrée - désactivée", commande.getNumeroCommandeClient());
        }

        log.info("Livraison créée: BL {} - {} unités de {} pour {}",
                numeroBL, request.getQuantiteLivree(), article.getArticle(), client.getNomComplet());

        // Charger les objets pour la réponse
        livraison.setArticle(article);
        livraison.setClient(client);
        livraison.setCommande(commande);
        return mapToResponse(livraison);
    }

    private String generateNumeroBL(int year) {
        // ✅ Chercher par pattern de l'année
        List<Livraison> livraisons = livraisonRepository.findByNumeroBLContaining("/" + year);

        if (livraisons.isEmpty()) {
            return "1/" + year;
        }

        // Trouver le plus grand numéro pour cette année
        int maxNumber = livraisons.stream()
                .map(l -> {
                    String[] parts = l.getNumeroBL().split("/");
                    try {
                        return Integer.parseInt(parts[0]);
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max(Integer::compareTo)
                .orElse(0);

        return (maxNumber + 1) + "/" + year;
    }

    public List<LivraisonResponse> getAllLivraisons() {
        return livraisonRepository.findAllActiveWithDetails()
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public LivraisonResponse getLivraisonById(String id) {
        Livraison livraison = livraisonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Livraison non trouvée"));
        return loadEntitiesAndMap(livraison);
    }

    public List<LivraisonResponse> searchByArticleRef(String articleRef) {
        return livraisonRepository.findByArticleRef(articleRef)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<LivraisonResponse> searchByClientNom(String clientNom) {
        return livraisonRepository.findByClientNom(clientNom)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    public List<LivraisonResponse> searchByNumeroCommande(String numeroCommande) {
        return livraisonRepository.findByNumeroCommande(numeroCommande)
                .stream()
                .map(this::loadEntitiesAndMap)
                .collect(Collectors.toList());
    }

    @Transactional
    public LivraisonResponse updateLivraison(String id, UpdateLivraisonRequest request) {
        Livraison livraison = livraisonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Livraison non trouvée"));

        // Restaurer l'ancien stock
        Article oldArticle = articleRepository.findById(livraison.getArticleId())
                .orElseThrow(() -> new RuntimeException("Article original non trouvé"));
        int oldQuantite = livraison.getQuantiteLivree();
        oldArticle.setStock(oldArticle.getStock() + oldQuantite);
        oldArticle.setUpdatedAt(LocalDateTime.now());

        // Nouveau article
        Article newArticle = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        Client newClient = clientRepository.findByNomComplet(request.getClientNom())
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + request.getClientNom()));

        // ✅ Trouver la nouvelle commande
        List<Commande> commandes = commandeRepository.findByArticleRef(request.getArticleRef());
        Commande newCommande = commandes.stream()
                .filter(c -> c.getNumeroCommandeClient().equals(request.getNumeroCommandeClient()))
                .filter(c -> c.getClientNom().equals(request.getClientNom()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        // Vérifier le stock
        if (newArticle.getStock() < request.getQuantiteLivree()) {
            throw new RuntimeException("Stock insuffisant");
        }

        LocalDate dateLivraison = LocalDate.parse(request.getDateLivraison(), DATE_FORMATTER);

        // ✅ Mettre à jour avec IDs et données dénormalisées
        livraison.setArticleId(newArticle.getId());
        livraison.setArticleRef(newArticle.getRef());
        livraison.setArticleNom(newArticle.getArticle());
        livraison.setClientId(newClient.getId());
        livraison.setClientNom(newClient.getNomComplet());
        livraison.setCommandeId(newCommande.getId());
        livraison.setNumeroCommandeClient(newCommande.getNumeroCommandeClient());
        livraison.setQuantiteLivree(request.getQuantiteLivree());
        livraison.setDateLivraison(dateLivraison);
        livraison.setUpdatedAt(LocalDateTime.now());

        livraison = livraisonRepository.save(livraison);

        // Déduire du nouveau stock
        newArticle.setStock(newArticle.getStock() - request.getQuantiteLivree());
        newArticle.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(newArticle);

        // Sauvegarder l'ancien article si différent
        if (!oldArticle.getId().equals(newArticle.getId())) {
            articleRepository.save(oldArticle);
        }

        log.info("Livraison mise à jour: ID {}", id);

        livraison.setArticle(newArticle);
        livraison.setClient(newClient);
        livraison.setCommande(newCommande);
        return mapToResponse(livraison);
    }

    @Transactional
    public void deleteLivraison(String id) {
        Livraison livraison = livraisonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Livraison non trouvée"));

        // Restaurer le stock
        Article article = articleRepository.findById(livraison.getArticleId())
                .orElseThrow(() -> new RuntimeException("Article non trouvé"));
        article.setStock(article.getStock() + livraison.getQuantiteLivree());
        article.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(article);

        // Réactiver la commande si elle était désactivée
        Commande commande = commandeRepository.findById(livraison.getCommandeId())
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        commande.setIsActive(true);
        commande.setUpdatedAt(LocalDateTime.now());
        commandeRepository.save(commande);

        livraisonRepository.deleteById(id);
        log.info("Livraison supprimée: ID {} - Commande réactivée", id);
    }

    // ============ MÉTHODES PRIVÉES ============

    private LivraisonResponse loadEntitiesAndMap(Livraison livraison) {
        // Charger les entités si pas déjà présentes
        if (livraison.getArticle() == null) {
            Article article = articleRepository.findById(livraison.getArticleId())
                    .orElseThrow(() -> new RuntimeException("Article non trouvé"));
            livraison.setArticle(article);
        }

        if (livraison.getClient() == null) {
            Client client = clientRepository.findById(livraison.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));
            livraison.setClient(client);
        }

        if (livraison.getCommande() == null) {
            Commande commande = commandeRepository.findById(livraison.getCommandeId())
                    .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
            livraison.setCommande(commande);
        }

        return mapToResponse(livraison);
    }

    private LivraisonResponse mapToResponse(Livraison livraison) {
        // Utiliser les données dénormalisées si les objets ne sont pas chargés
        String articleRef = livraison.getArticle() != null ?
                livraison.getArticle().getRef() : livraison.getArticleRef();
        String articleNom = livraison.getArticle() != null ?
                livraison.getArticle().getArticle() : livraison.getArticleNom();
        String clientNom = livraison.getClient() != null ?
                livraison.getClient().getNomComplet() : livraison.getClientNom();
        String numeroCommandeClient = livraison.getCommande() != null ?
                livraison.getCommande().getNumeroCommandeClient() : livraison.getNumeroCommandeClient();

        return LivraisonResponse.builder()
                .id(livraison.getId())
                .numeroBL(livraison.getNumeroBL())
                .articleRef(articleRef)
                .articleNom(articleNom)
                .clientNom(clientNom)
                .numeroCommandeClient(numeroCommandeClient)
                .quantiteLivree(livraison.getQuantiteLivree())
                .dateLivraison(livraison.getDateLivraison().format(DATE_FORMATTER))
                .isActive(livraison.getIsActive())
                .createdAt(livraison.getCreatedAt().format(DATETIME_FORMATTER))
                .updatedAt(livraison.getUpdatedAt().format(DATETIME_FORMATTER))
                .build();
    }
}