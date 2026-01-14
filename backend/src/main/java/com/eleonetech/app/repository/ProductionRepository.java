package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Production;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductionRepository extends MongoRepository<Production, String> {

    // ✅ Maintenant on peut chercher directement par articleRef
    @Query(value = "{'isActive': true}", sort = "{'dateProduction': -1, 'id': -1}")
    List<Production> findAllActiveWithArticle();

    @Query("{'articleRef': ?0, 'isActive': true}")
    List<Production> findByArticleRef(String articleRef);

    @Query("{'dateProduction': ?0, 'isActive': true}")
    List<Production> findByDate(LocalDate date);

    @Query("{'articleRef': ?0, 'dateProduction': ?1, 'isActive': true}")
    List<Production> findByArticleRefAndDate(String articleRef, LocalDate date);

    @Query("{'dateProduction': {$gte: ?0, $lte: ?1}, 'isActive': true}")
    List<Production> findByDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("{'articleRef': ?0, 'dateProduction': {$gte: ?1, $lte: ?2}, 'isActive': true}")
    List<Production> findByArticleRefAndDateBetween(String articleRef, LocalDate startDate, LocalDate endDate);

    // Alternative avec méthode dérivée (sans @Query)
    List<Production> findByArticleRefAndIsActiveTrue(String articleRef);
    List<Production> findByDateProductionAndIsActiveTrue(LocalDate date);
    List<Production> findByArticleIdAndIsActiveTrue(String articleId);
}