package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Commande;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommandeRepository extends MongoRepository<Commande, String> {

    // ✅ Requêtes corrigées - utilisent maintenant articleRef et clientNom directement

    @Query(value = "{'isActive': true}", sort = "{'dateSouhaitee': -1, 'id': -1}")
    List<Commande> findAllActiveWithDetails();

    @Query("{'articleRef': ?0, 'isActive': true}")
    List<Commande> findByArticleRef(String articleRef);

    @Query("{'clientNom': ?0, 'isActive': true}")
    List<Commande> findByClientNom(String clientNom);

    @Query("{'dateSouhaitee': ?0, 'isActive': true}")
    List<Commande> findByDateSouhaitee(LocalDate date);

    @Query("{'articleRef': ?0, 'dateSouhaitee': ?1, 'isActive': true}")
    List<Commande> findByArticleRefAndDateSouhaitee(String articleRef, LocalDate date);

    @Query("{'articleRef': ?0, 'dateSouhaitee': {$gte: ?1, $lte: ?2}, 'isActive': true}")
    List<Commande> findByArticleRefAndPeriodeSouhaitee(String articleRef, LocalDate dateDebut, LocalDate dateFin);

    // Pour les recherches par date d'ajout (createdAt)
    List<Commande> findByCreatedAtBetweenAndIsActiveTrue(LocalDateTime start, LocalDateTime end);

    List<Commande> findByArticleRefAndCreatedAtBetweenAndIsActiveTrue(String articleRef, LocalDateTime start, LocalDateTime end);

    // Méthodes dérivées (alternatives simples)
    List<Commande> findByArticleRefAndIsActiveTrue(String articleRef);
    List<Commande> findByClientNomAndIsActiveTrue(String clientNom);
    List<Commande> findByDateSouhaiteeAndIsActiveTrue(LocalDate date);
    List<Commande> findByArticleIdAndIsActiveTrue(String articleId);
    List<Commande> findByClientIdAndIsActiveTrue(String clientId);
}