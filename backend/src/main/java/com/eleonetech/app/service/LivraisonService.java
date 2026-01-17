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

        // Trouver la commande
        List<Commande> commandes = commandeRepository.findByArticleRef(request.getArticleRef());
        Commande commande = commandes.stream()
                .filter(c -> c.getNumeroCommandeClient().equals(request.getNumeroCommandeClient()))
                .filter(c -> c.getClientNom().equals(request.getClientNom()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        LocalDate dateLivraison = LocalDate.parse(request.getDateLivraison(), DATE_FORMATTER);

        // ✅ VÉRIFIER L'UNICITÉ: Numéro de commande + Date de livraison
        boolean exists = livraisonRepository.findByNumeroCommande(request.getNumeroCommandeClient())
                .stream()
                .anyMatch(l -> l.getDateLivraison().equals(dateLivraison) && l.getIsActive());

        if (exists) {
            throw new RuntimeException("Une livraison existe déjà pour cette commande à cette date");
        }

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

        // Générer le numéro BL
        String numeroBL = generateNumeroBL(dateLivraison.getYear());

        // Créer la livraison avec IDs et données dénormalisées
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
        List<Livraison> livraisons = livraisonRepository.findByNumeroBLContaining("/" + year);

        if (livraisons.isEmpty()) {
            return "1/" + year;
        }

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

        LocalDate dateLivraison = LocalDate.parse(request.getDateLivraison(), DATE_FORMATTER);

        // ✅ VÉRIFIER L'UNICITÉ si le numéro de commande ou la date change
        if (!livraison.getNumeroCommandeClient().equals(request.getNumeroCommandeClient()) ||
                !livraison.getDateLivraison().equals(dateLivraison)) {

            boolean exists = livraisonRepository.findByNumeroCommande(request.getNumeroCommandeClient())
                    .stream()
                    .anyMatch(l -> l.getDateLivraison().equals(dateLivraison) &&
                            l.getIsActive() &&
                            !l.getId().equals(id));

            if (exists) {
                throw new RuntimeException("Une livraison existe déjà pour cette commande à cette date");
            }
        }

        // ✅ CORRECTION: Gérer le stock correctement
        // 1. Charger l'ancien article
        Article oldArticle = articleRepository.findById(livraison.getArticleId())
                .orElseThrow(() -> new RuntimeException("Article original non trouvé"));

        int oldQuantite = livraison.getQuantiteLivree();

        // 2. Charger le nouveau client et article
        Client newClient = clientRepository.findByNomComplet(request.getClientNom())
                .orElseThrow(() -> new RuntimeException("Client non trouvé: " + request.getClientNom()));

        Article newArticle = articleRepository.findByRef(request.getArticleRef())
                .orElseThrow(() -> new RuntimeException("Article non trouvé: " + request.getArticleRef()));

        // 3. Trouver la nouvelle commande
        List<Commande> commandes = commandeRepository.findByArticleRef(request.getArticleRef());
        Commande newCommande = commandes.stream()
                .filter(c -> c.getNumeroCommandeClient().equals(request.getNumeroCommandeClient()))
                .filter(c -> c.getClientNom().equals(request.getClientNom()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        // 4. Si c'est le MÊME article
        if (oldArticle.getId().equals(newArticle.getId())) {
            // Calculer la différence de quantité
            int difference = request.getQuantiteLivree() - oldQuantite;

            log.info("🔄 Mise à jour livraison - Article: {}, Ancienne qté: {}, Nouvelle qté: {}, Différence: {}",
                    oldArticle.getRef(), oldQuantite, request.getQuantiteLivree(), difference);

            // Vérifier le stock avant la modification
            // Stock actuel + ancienne quantité - nouvelle quantité
            int stockApresModification = newArticle.getStock() - difference;
            if (stockApresModification < 0) {
                throw new RuntimeException("Stock insuffisant. Stock disponible: " + newArticle.getStock());
            }

            // Ajuster le stock avec la différence (négatif si on livre plus)
            newArticle.setStock(stockApresModification);

            log.info("📦 Stock mis à jour: {} (retrait de {})", newArticle.getStock(), difference);
        }
        // 5. Si c'est un ARTICLE DIFFÉRENT
        else {
            log.info("🔄 Changement d'article - Ancien: {}, Nouveau: {}",
                    oldArticle.getRef(), newArticle.getRef());

            // Remettre la quantité à l'ancien article
            oldArticle.setStock(oldArticle.getStock() + oldQuantite);
            oldArticle.setUpdatedAt(LocalDateTime.now());
            articleRepository.save(oldArticle);

            log.info("📦 Stock ancien article: {} (ajout de {})", oldArticle.getStock(), oldQuantite);

            // Vérifier le stock du nouveau article
            if (newArticle.getStock() < request.getQuantiteLivree()) {
                throw new RuntimeException("Stock insuffisant pour le nouvel article. Stock disponible: " +
                        newArticle.getStock());
            }

            // Retirer du nouveau article
            newArticle.setStock(newArticle.getStock() - request.getQuantiteLivree());

            log.info("📦 Stock nouveau article: {} (retrait de {})", newArticle.getStock(), request.getQuantiteLivree());
        }

        // 6. Mettre à jour la livraison
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

        // 7. Sauvegarder l'article mis à jour
        newArticle.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(newArticle);

        log.info("✅ Livraison mise à jour: ID {}", id);

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

    private LivraisonResponse loadEntitiesAndMap(Livraison livraison) {
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