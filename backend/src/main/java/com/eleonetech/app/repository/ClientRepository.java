package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    Optional<Client> findByNomComplet(String nomComplet);
    Boolean existsByNomComplet(String nomComplet);
    List<Client> findByIsActiveTrue();

    @Query("SELECT c FROM Client c WHERE c.isActive = true ORDER BY c.nomComplet ASC")
    List<Client> findAllActiveOrderByNomComplet();
}