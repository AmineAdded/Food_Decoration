package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Livraison;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LivraisonRepository extends MongoRepository<Livraison, String> {

    // ✅ Requêtes corrigées - utilisent maintenant les champs directs

    @Query(value = "{'isActive': true}", sort = "{'dateLivraison': -1, 'id': -1}")
    List<Livraison> findAllActiveWithDetails();

    @Query("{'articleRef': ?0, 'isActive': true}")
    List<Livraison> findByArticleRef(String articleRef);

    @Query("{'clientNom': ?0, 'isActive': true}")
    List<Livraison> findByClientNom(String clientNom);

    @Query("{'numeroCommandeClient': ?0, 'isActive': true}")
    List<Livraison> findByNumeroCommande(String numeroCommande);

    @Query("{'dateLivraison': ?0, 'isActive': true}")
    List<Livraison> findByDateLivraison(LocalDate date);

    @Query("{'commandeId': ?0, 'isActive': true}")
    List<Livraison> findByCommandeId(String commandeId);

    // Pour générer les numéros BL par année
    @Query("{'numeroBL': {$regex: ?0}, 'isActive': true}")
    List<Livraison> findByNumeroBLContaining(String yearPattern);

    // Méthodes dérivées (alternatives simples)
    List<Livraison> findByArticleRefAndIsActiveTrue(String articleRef);
    List<Livraison> findByClientNomAndIsActiveTrue(String clientNom);
    List<Livraison> findByCommandeIdAndIsActiveTrue(String commandeId);
    List<Livraison> findByArticleIdAndIsActiveTrue(String articleId);
    List<Livraison> findByClientIdAndIsActiveTrue(String clientId);
    List<Livraison> findByDateLivraisonAndIsActiveTrue(LocalDate date);

    // Méthode pour calculer la somme des quantités livrées pour une commande
    default Integer sumQuantiteLivreeByCommandeId(String commandeId) {
        List<Livraison> livraisons = findByCommandeId(commandeId);
        return livraisons.stream()
                .mapToInt(Livraison::getQuantiteLivree)
                .sum();
    }
}