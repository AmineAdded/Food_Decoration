package com.eleonetech.app.service;

import com.eleonetech.app.dto.ClientResponse;
import com.eleonetech.app.dto.ClientSimpleResponse;
import com.eleonetech.app.dto.CreateClientRequest;
import com.eleonetech.app.dto.UpdateClientRequest;
import com.eleonetech.app.entity.Client;
import com.eleonetech.app.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientService {

    private final ClientRepository clientRepository;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public ClientResponse createClient(CreateClientRequest request) {
        // Convertir chaîne vide en NULL
        String ref = (request.getRef() == null || request.getRef().trim().isEmpty())
                ? null
                : request.getRef().trim();

        // Vérifier unicité seulement si ref n'est pas null
        if (ref != null && clientRepository.existsByRef(ref)) {
            throw new RuntimeException("Un client avec cette référence existe déjà");
        }

        // Vérifier unicité du nom
        if (clientRepository.existsByNomComplet(request.getNomComplet())) {
            throw new RuntimeException("Un client avec ce nom existe déjà");
        }

        Client client = Client.builder()
                .ref(ref)
                .nomComplet(request.getNomComplet())
                .adresseLivraison(request.getAdresseLivraison())
                .adresseFacturation(request.getAdresseFacturation())
                .devise(request.getDevise())
                .modeTransport(request.getModeTransport())
                .incoTerme(request.getIncoTerme())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        client = clientRepository.save(client);
        log.info("Client créé: {} (Ref: {})", client.getNomComplet(), client.getRef());

        return mapToResponse(client);
    }

    public List<ClientResponse> getAllClients() {
        return clientRepository.findAllActiveOrderByRef()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ClientSimpleResponse> getAllClientsSimple() {
        return clientRepository.findAllActiveOrderByRef()
                .stream()
                .map(client -> ClientSimpleResponse.builder()
                        .id(client.getId())
                        .nomComplet(client.getNomComplet())
                        .build())
                .collect(Collectors.toList());
    }

    public ClientResponse getClientById(String id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
        return mapToResponse(client);
    }

    @Transactional
    public ClientResponse updateClient(String id, UpdateClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        // Convertir chaîne vide en NULL
        String newRef = (request.getRef() == null || request.getRef().trim().isEmpty())
                ? null
                : request.getRef().trim();

        // Vérifier unicité seulement si ref a changé et n'est pas null
        if (newRef != null) {
            boolean refChanged = (client.getRef() == null || !client.getRef().equals(newRef));
            if (refChanged && clientRepository.existsByRef(newRef)) {
                throw new RuntimeException("Un client avec cette référence existe déjà");
            }
        }

        // Vérifier unicité du nom
        if (request.getNomComplet() != null &&
                !client.getNomComplet().equals(request.getNomComplet()) &&
                clientRepository.existsByNomComplet(request.getNomComplet())) {
            throw new RuntimeException("Un client avec ce nom existe déjà");
        }

        // Mise à jour
        client.setRef(newRef);

        if (request.getNomComplet() != null) {
            client.setNomComplet(request.getNomComplet());
        }
        if (request.getAdresseLivraison() != null) {
            client.setAdresseLivraison(request.getAdresseLivraison());
        }
        if (request.getAdresseFacturation() != null) {
            client.setAdresseFacturation(request.getAdresseFacturation());
        }
        if (request.getDevise() != null) {
            client.setDevise(request.getDevise());
        }
        if (request.getModeTransport() != null) {
            client.setModeTransport(request.getModeTransport());
        }
        if (request.getIncoTerme() != null) {
            client.setIncoTerme(request.getIncoTerme());
        }

        client.setUpdatedAt(LocalDateTime.now());

        client = clientRepository.save(client);
        log.info("Client mis à jour: {} (Ref: {})", client.getNomComplet(), client.getRef());

        return mapToResponse(client);
    }

    @Transactional
    public void deleteClient(String id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        clientRepository.deleteById(id);
        log.info("Client supprimé: {} (Ref: {})", client.getNomComplet(), client.getRef());
    }

    public List<ClientResponse> searchByNomComplet(String nomComplet) {
        return clientRepository.findByNomCompletContaining(nomComplet)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ClientResponse> searchByModeTransport(String modeTransport) {
        return clientRepository.findByModeTransport(modeTransport)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ClientResponse> searchByIncoTerme(String incoTerme) {
        return clientRepository.findByIncoTerme(incoTerme)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<String> getDistinctNomComplets() {
        return clientRepository.findDistinctNomComplets()
                .stream()
                .map(Client::getNomComplet)
                .collect(Collectors.toList());
    }

    private ClientResponse mapToResponse(Client client) {
        return ClientResponse.builder()
                .id(client.getId())
                .ref(client.getRef())
                .nomComplet(client.getNomComplet())
                .adresseLivraison(client.getAdresseLivraison())
                .adresseFacturation(client.getAdresseFacturation())
                .devise(client.getDevise())
                .modeTransport(client.getModeTransport())
                .incoTerme(client.getIncoTerme())
                .isActive(client.getIsActive())
                .createdAt(client.getCreatedAt() != null ? client.getCreatedAt().format(formatter) : null)
                .updatedAt(client.getUpdatedAt() != null ? client.getUpdatedAt().format(formatter) : null)
                .build();
    }
}