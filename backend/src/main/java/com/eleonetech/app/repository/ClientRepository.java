package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Client;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends MongoRepository<Client, String> {
    Optional<Client> findByRef(String ref);
    Optional<Client> findByNomComplet(String nomComplet);
    Boolean existsByRef(String ref);
    Boolean existsByNomComplet(String nomComplet);
    List<Client> findByIsActiveTrue();

    @Query(value = "{'isActive': true}", sort = "{'ref': 1}")
    List<Client> findAllActiveOrderByRef();

    @Query(value = "{'nomComplet': {$regex: ?0, $options: 'i'}, 'isActive': true}", sort = "{'ref': 1}")
    List<Client> findByNomCompletContaining(String nomComplet);

    @Query(value = "{'modeTransport': ?0, 'isActive': true}", sort = "{'ref': 1}")
    List<Client> findByModeTransport(String modeTransport);

    @Query(value = "{'incoTerme': ?0, 'isActive': true}", sort = "{'ref': 1}")
    List<Client> findByIncoTerme(String incoTerme);

    @Query(value = "{'isActive': true}", fields = "{'nomComplet': 1}")
    List<Client> findDistinctNomComplets();
}