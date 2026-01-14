package com.eleonetech.app.controller;

import com.eleonetech.app.dto.*;
import com.eleonetech.app.service.ProcessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/process")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}")
@Slf4j
public class ProcessController {

    private final ProcessService processService;

    @PostMapping
    public ResponseEntity<?> createProcess(@Valid @RequestBody CreateProcessRequest request) {
        try {
            ProcessResponse response = processService.createProcess(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création du process: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ProcessResponse>> getAllProcess() {
        List<ProcessResponse> process = processService.getAllProcess();
        return ResponseEntity.ok(process);
    }

    @GetMapping("/simple")
    public ResponseEntity<List<ProcessSimpleResponse>> getAllProcessSimple() {
        List<ProcessSimpleResponse> process = processService.getAllProcessSimple();
        return ResponseEntity.ok(process);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProcessById(@PathVariable String id) {
        try {
            ProcessResponse response = processService.getProcessById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la récupération du process: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProcess(
            @PathVariable String id,
            @Valid @RequestBody UpdateProcessRequest request) {
        try {
            ProcessResponse response = processService.updateProcess(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la mise à jour du process: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProcess(@PathVariable String id) {
        try {
            processService.deleteProcess(id);
            return ResponseEntity.ok(new MessageResponse("Process supprimé avec succès"));
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression du process: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }
    @GetMapping("/search/nom/{nom}")
    public ResponseEntity<List<ProcessResponse>> searchByNom(@PathVariable String nom) {
        List<ProcessResponse> process = processService.searchByNom(nom);
        return ResponseEntity.ok(process);
    }
    @GetMapping("/distinct-noms")
    public ResponseEntity<List<String>> getDistinctNoms() {
        List<String> noms = processService.getDistinctNoms();
        return ResponseEntity.ok(noms);
    }
}