package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    Optional<Article> findByRef(String ref);
    Boolean existsByRef(String ref);
    List<Article> findByIsActiveTrue();

    // ✅ SOLUTION : Charger d'abord avec articleClients
    @Query("SELECT DISTINCT a FROM Article a " +
            "LEFT JOIN FETCH a.articleClients ac " +
            "LEFT JOIN FETCH ac.client " +
            "WHERE a.isActive = true " +
            "ORDER BY a.ref ASC")
    List<Article> findAllActiveWithClients();

    // ✅ Ensuite charger articleProcesses séparément
    @Query("SELECT DISTINCT a FROM Article a " +
            "LEFT JOIN FETCH a.articleProcesses ap " +
            "LEFT JOIN FETCH ap.process " +
            "WHERE a IN :articles")
    List<Article> findArticlesWithProcesses(@Param("articles") List<Article> articles);

    @Query("SELECT a FROM Article a " +
            "LEFT JOIN FETCH a.articleClients ac " +
            "LEFT JOIN FETCH ac.client " +
            "LEFT JOIN FETCH a.articleProcesses ap " +
            "LEFT JOIN FETCH ap.process " +
            "WHERE a.id = :id")
    Optional<Article> findByIdWithRelations(Long id);
}