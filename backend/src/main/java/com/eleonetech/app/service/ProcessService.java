package com.eleonetech.app.service;

import com.eleonetech.app.dto.CreateProcessRequest;
import com.eleonetech.app.dto.ProcessResponse;
import com.eleonetech.app.dto.ProcessSimpleResponse;
import com.eleonetech.app.dto.UpdateProcessRequest;
import com.eleonetech.app.entity.Process;
import com.eleonetech.app.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessService {

    private final ProcessRepository processRepository;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public ProcessResponse createProcess(CreateProcessRequest request) {
        if (processRepository.existsByRef(request.getRef())) {
            throw new RuntimeException("Un process avec cette référence existe déjà");
        }

        if (processRepository.existsByNom(request.getNom())) {
            throw new RuntimeException("Un process avec ce nom existe déjà");
        }

        Process process = Process.builder()
                .ref(request.getRef())
                .nom(request.getNom())
                .isActive(true)
                .build();

        process = processRepository.save(process);
        log.info("Process créé: {} (Ref: {})", process.getNom(), process.getRef());

        return mapToResponse(process);
    }

    public List<ProcessResponse> getAllProcess() {
        return processRepository.findAllActiveOrderByRef()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProcessSimpleResponse> getAllProcessSimple() {
        return processRepository.findAllActiveOrderByRef()
                .stream()
                .map(process -> ProcessSimpleResponse.builder()
                        .id(process.getId())
                        .nom(process.getNom())
                        .build())
                .collect(Collectors.toList());
    }

    public ProcessResponse getProcessById(Long id) {
        Process process = processRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Process non trouvé"));
        return mapToResponse(process);
    }

    @Transactional
    public ProcessResponse updateProcess(Long id, UpdateProcessRequest request) {
        Process process = processRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Process non trouvé"));

        if (request.getRef() != null && !process.getRef().equals(request.getRef()) &&
                processRepository.existsByRef(request.getRef())) {
            throw new RuntimeException("Un process avec cette référence existe déjà");
        }

        if (request.getNom() != null && !process.getNom().equals(request.getNom()) &&
                processRepository.existsByNom(request.getNom())) {
            throw new RuntimeException("Un process avec ce nom existe déjà");
        }

        if (request.getRef() != null) {
            process.setRef(request.getRef());
        }
        if (request.getNom() != null) {
            process.setNom(request.getNom());
        }

        process = processRepository.save(process);
        log.info("Process mis à jour: {} (Ref: {})", process.getNom(), process.getRef());

        return mapToResponse(process);
    }

    @Transactional
    public void deleteProcess(Long id) {
        Process process = processRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Process non trouvé"));

        processRepository.deleteById(id);
        log.info("Process supprimé: {} (Ref: {})", process.getNom(), process.getRef());
    }

    private ProcessResponse mapToResponse(Process process) {
        return ProcessResponse.builder()
                .id(process.getId())
                .ref(process.getRef())
                .nom(process.getNom())
                .isActive(process.getIsActive())
                .createdAt(process.getCreatedAt().format(formatter))
                .updatedAt(process.getUpdatedAt().format(formatter))
                .build();
    }
}