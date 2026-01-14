package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Article;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleRepository extends MongoRepository<Article, String> {
    Optional<Article> findByRef(String ref);
    Boolean existsByRef(String ref);
    List<Article> findByIsActiveTrue();

    @Query("{'isActive': true}")
    List<Article> findAllActiveWithClients();

    @Query("{'ref': ?0, 'isActive': true}")
    List<Article> findByRefWithClients(String ref);

    @Query("{'article': ?0, 'isActive': true}")
    List<Article> findByNomWithClients(String nom);

    @Query("{'famille': ?0, 'isActive': true}")
    List<Article> findByFamilleWithClients(String famille);

    @Query("{'typeProduit': ?0, 'isActive': true}")
    List<Article> findByTypeProduitWithClients(String typeProduit);

    @Query("{'typeProcess': ?0, 'isActive': true}")
    List<Article> findByTypeProcessWithClients(String typeProcess);

    @Query(value = "{'isActive': true}", fields = "{'ref': 1}")
    List<Article> findDistinctRefs();

    @Query(value = "{'isActive': true}", fields = "{'article': 1}")
    List<Article> findDistinctNoms();

    @Query(value = "{'famille': {$ne: null, $ne: ''}, 'isActive': true}", fields = "{'famille': 1}")
    List<Article> findDistinctFamilles();

    @Query(value = "{'typeProduit': {$ne: null, $ne: ''}, 'isActive': true}", fields = "{'typeProduit': 1}")
    List<Article> findDistinctTypeProduits();

    @Query(value = "{'typeProcess': {$ne: null, $ne: ''}, 'isActive': true}", fields = "{'typeProcess': 1}")
    List<Article> findDistinctTypeProcess();

    @Query("{'isActive': true, 'clients.$id': ?0}")
    List<Article> findByClientId(String clientId);

    @Query("{'isActive': true, 'processes.process.$id': ?0}")
    List<Article> findByProcessId(String processId);
}