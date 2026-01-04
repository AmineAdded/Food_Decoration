// backend/src/main/java/com/eleonetech/app/repository/CommandeRepository.java
package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Commande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {

    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE c.isActive = true " +
            "ORDER BY c.dateSouhaitee DESC, c.id DESC")
    List<Commande> findAllActiveWithDetails();

    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE c.id = :id")
    Commande findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE a.ref = :articleRef " +
            "AND c.isActive = true " +
            "ORDER BY c.dateSouhaitee DESC")
    List<Commande> findByArticleRef(@Param("articleRef") String articleRef);

    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE cl.nomComplet = :clientNom " +
            "AND c.isActive = true " +
            "ORDER BY c.dateSouhaitee DESC")
    List<Commande> findByClientNom(@Param("clientNom") String clientNom);

    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE c.dateSouhaitee = :date " +
            "AND c.isActive = true " +
            "ORDER BY c.id DESC")
    List<Commande> findByDateSouhaitee(@Param("date") LocalDate date);

    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE DATE(c.createdAt) = :date " +
            "AND c.isActive = true " +
            "ORDER BY c.id DESC")
    List<Commande> findByDateAjout(@Param("date") LocalDate date);

    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE a.ref = :articleRef " +
            "AND c.dateSouhaitee = :date " +
            "AND c.isActive = true " +
            "ORDER BY c.id DESC")
    List<Commande> findByArticleRefAndDateSouhaitee(
            @Param("articleRef") String articleRef,
            @Param("date") LocalDate date
    );

    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE a.ref = :articleRef " +
            "AND DATE(c.createdAt) = :date " +
            "AND c.isActive = true " +
            "ORDER BY c.id DESC")
    List<Commande> findByArticleRefAndDateAjout(
            @Param("articleRef") String articleRef,
            @Param("date") LocalDate date
    );

    // ✅ NOUVEAU: Recherche par période (date souhaitée)
    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE a.ref = :articleRef " +
            "AND c.dateSouhaitee BETWEEN :dateDebut AND :dateFin " +
            "AND c.isActive = true " +
            "ORDER BY c.dateSouhaitee DESC")
    List<Commande> findByArticleRefAndPeriodeSouhaitee(
            @Param("articleRef") String articleRef,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    // ✅ NOUVEAU: Recherche par période (date de création)
    @Query("SELECT c FROM Commande c " +
            "LEFT JOIN FETCH c.article a " +
            "LEFT JOIN FETCH c.client cl " +
            "WHERE a.ref = :articleRef " +
            "AND DATE(c.createdAt) BETWEEN :dateDebut AND :dateFin " +
            "AND c.isActive = true " +
            "ORDER BY c.createdAt DESC")
    List<Commande> findByArticleRefAndPeriodeAjout(
            @Param("articleRef") String articleRef,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    // Sommaires pour le total - uniquement pour article
    @Query("SELECT SUM(c.quantite) FROM Commande c " +
            "WHERE c.article.ref = :articleRef AND c.isActive = true")
    Integer sumQuantiteByArticleRef(@Param("articleRef") String articleRef);

    @Query("SELECT SUM(c.quantite) FROM Commande c " +
            "WHERE c.article.ref = :articleRef " +
            "AND c.dateSouhaitee = :date AND c.isActive = true")
    Integer sumQuantiteByArticleRefAndDateSouhaitee(
            @Param("articleRef") String articleRef,
            @Param("date") LocalDate date
    );

    @Query("SELECT SUM(c.quantite) FROM Commande c " +
            "WHERE c.article.ref = :articleRef " +
            "AND DATE(c.createdAt) = :date AND c.isActive = true")
    Integer sumQuantiteByArticleRefAndDateAjout(
            @Param("articleRef") String articleRef,
            @Param("date") LocalDate date
    );

    // ✅ NOUVEAU: Sommaires pour les périodes
    @Query("SELECT SUM(c.quantite) FROM Commande c " +
            "WHERE c.article.ref = :articleRef " +
            "AND c.dateSouhaitee BETWEEN :dateDebut AND :dateFin " +
            "AND c.isActive = true")
    Integer sumQuantiteByArticleRefAndPeriodeSouhaitee(
            @Param("articleRef") String articleRef,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    @Query("SELECT SUM(c.quantite) FROM Commande c " +
            "WHERE c.article.ref = :articleRef " +
            "AND DATE(c.createdAt) BETWEEN :dateDebut AND :dateFin " +
            "AND c.isActive = true")
    Integer sumQuantiteByArticleRefAndPeriodeAjout(
            @Param("articleRef") String articleRef,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );
}