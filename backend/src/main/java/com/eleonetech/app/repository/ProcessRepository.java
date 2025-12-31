package com.eleonetech.app.repository;

import com.eleonetech.app.entity.Process;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessRepository extends JpaRepository<Process, Long> {
    Optional<Process> findByRef(String ref);
    Optional<Process> findByNom(String nom);
    Boolean existsByRef(String ref);
    Boolean existsByNom(String nom);
    List<Process> findByIsActiveTrue();

    @Query("SELECT p FROM Process p WHERE p.isActive = true ORDER BY p.ref ASC")
    List<Process> findAllActiveOrderByRef();
}