package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Process;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessRepository extends MongoRepository<Process, String> {
    Optional<Process> findByRef(String ref);
    Optional<Process> findByNom(String nom);
    Boolean existsByRef(String ref);
    Boolean existsByNom(String nom);
    List<Process> findByIsActiveTrue();

    @Query(value = "{'isActive': true}", sort = "{'ref': 1}")
    List<Process> findAllActiveOrderByRef();

    @Query(value = "{'nom': {$regex: ?0, $options: 'i'}, 'isActive': true}", sort = "{'ref': 1}")
    List<Process> findByNomContaining(String nom);

    @Query(value = "{'isActive': true}", fields = "{'nom': 1}")
    List<Process> findDistinctNoms();
}