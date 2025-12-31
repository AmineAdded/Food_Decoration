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
        // Vérifier si le client existe déjà
        if (clientRepository.existsByNomComplet(request.getNomComplet())) {
            throw new RuntimeException("Un client avec ce nom existe déjà");
        }

        Client client = Client.builder()
                .nomComplet(request.getNomComplet())
                .adresseLivraison(request.getAdresseLivraison())
                .adresseFacturation(request.getAdresseFacturation())
                .devise(request.getDevise())
                .modeTransport(request.getModeTransport())
                .incoTerme(request.getIncoTerme())
                .isActive(true)
                .build();

        client = clientRepository.save(client);
        log.info("Client créé: {}", client.getNomComplet());

        return mapToResponse(client);
    }

    public List<ClientResponse> getAllClients() {
        return clientRepository.findAllActiveOrderByNomComplet()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ClientSimpleResponse> getAllClientsSimple() {
        return clientRepository.findAllActiveOrderByNomComplet()
                .stream()
                .map(client -> ClientSimpleResponse.builder()
                        .id(client.getId())
                        .nomComplet(client.getNomComplet())
                        .build())
                .collect(Collectors.toList());
    }

    public ClientResponse getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
        return mapToResponse(client);
    }

    @Transactional
    public ClientResponse updateClient(Long id, UpdateClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        // Vérifier si le nouveau nom existe déjà (sauf si c'est le même client)
        if (!client.getNomComplet().equals(request.getNomComplet()) &&
                clientRepository.existsByNomComplet(request.getNomComplet())) {
            throw new RuntimeException("Un client avec ce nom existe déjà");
        }

        client.setNomComplet(request.getNomComplet());
        client.setAdresseLivraison(request.getAdresseLivraison());
        client.setAdresseFacturation(request.getAdresseFacturation());
        client.setDevise(request.getDevise());
        client.setModeTransport(request.getModeTransport());
        client.setIncoTerme(request.getIncoTerme());

        client = clientRepository.save(client);
        log.info("Client mis à jour: {}", client.getNomComplet());

        return mapToResponse(client);
    }

    @Transactional
    public void deleteClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        client.setIsActive(false);
        clientRepository.save(client);
        log.info("Client désactivé: {}", client.getNomComplet());
    }

    private ClientResponse mapToResponse(Client client) {
        return ClientResponse.builder()
                .id(client.getId())
                .nomComplet(client.getNomComplet())
                .adresseLivraison(client.getAdresseLivraison())
                .adresseFacturation(client.getAdresseFacturation())
                .devise(client.getDevise())
                .modeTransport(client.getModeTransport())
                .incoTerme(client.getIncoTerme())
                .isActive(client.getIsActive())
                .createdAt(client.getCreatedAt().format(formatter))
                .updatedAt(client.getUpdatedAt().format(formatter))
                .build();
    }
}