package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Livraison;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LivraisonRepository extends MongoRepository<Livraison, String> {

    @Query(value = "{'isActive': true}", sort = "{'dateLivraison': -1, 'id': -1}")
    List<Livraison> findAllActiveWithDetails();

    @Query("{'article.ref': ?0, 'isActive': true}")
    List<Livraison> findByArticleRef(String articleRef);

    @Query("{'client.nomComplet': ?0, 'isActive': true}")
    List<Livraison> findByClientNom(String clientNom);

    @Query("{'commande.numeroCommandeClient': ?0, 'isActive': true}")
    List<Livraison> findByNumeroCommande(String numeroCommande);

    @Query("{'dateLivraison': {$gte: ?0, $lte: ?0}}")
    List<Livraison> findByDateLivraison(LocalDate date);

    @Query(value = "{'dateLivraison': {$gte: ?0, $lte: ?1}}", fields = "{'numeroBL': 1}")
    List<Livraison> findLastNumeroBLForYear(int year);

    @Query("{'commande.$id': ?0, 'isActive': true}")
    List<Livraison> findByCommandeId(String commandeId);

    default Integer sumQuantiteLivreeByCommandeId(String commandeId) {
        List<Livraison> livraisons = findByCommandeId(commandeId);
        return livraisons.stream()
                .mapToInt(Livraison::getQuantiteLivree)
                .sum();
    }
}