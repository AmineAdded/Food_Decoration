// frontend/src/app/components/clients-table/clients-table.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ClientService,
  ClientResponse,
  CreateClientRequest,
  UpdateClientRequest
} from '../../services/client.service';

/**
 * Type FRONTEND (UI)
 */
interface ClientTable extends ClientResponse {
  isEditing?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-clients-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients-table.component.html',
  styleUrl: './clients-table.component.css'
})
export class ClientsTableComponent implements OnInit {

  clients = signal<ClientTable[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  deviseOptions = ['USD', 'EUR', 'TND'];
  modeTransportOptions = ['Terrestre', 'Aérien', 'Maritime'];
  incoTermeOptions = ['EXW', 'EDDU', 'DAP', 'DDP', 'FSA'];

  private originalClients: { [key: number]: ClientTable } = {};
  private editingClients: Set<number> = new Set();

  constructor(private clientService: ClientService) {}

  ngOnInit() {
    this.loadClients();
  }

  // =========================
  // LOAD
  // =========================
  loadClients() {
    this.isLoading.set(true);
    this.clientService.getAllClients().subscribe({
      next: (clients) => {
        const mapped: ClientTable[] = clients.map(c => ({
          ...c,
          isEditing: false,
          isNew: false
        }));
        this.clients.set(mapped);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set('Erreur lors du chargement des clients');
        this.isLoading.set(false);
      }
    });
  }

  // =========================
  // SEARCH
  // =========================
  filteredClients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.clients();

    return this.clients().filter(c =>
      c.ref?.toLowerCase().includes(term) ||
      c.nomComplet?.toLowerCase().includes(term) ||
      c.adresseLivraison?.toLowerCase().includes(term) ||
      c.adresseFacturation?.toLowerCase().includes(term) ||
      c.devise?.toLowerCase().includes(term) ||
      c.modeTransport?.toLowerCase().includes(term) ||
      c.incoTerme?.toLowerCase().includes(term)
    );
  });

  // =========================
  // ADD
  // =========================
  addNewRow() {
    const newClient: ClientTable = {
      id: 0 as any,
      ref: '',
      nomComplet: '',
      adresseLivraison: '',
      adresseFacturation: '',
      devise: '',
      modeTransport: '',
      incoTerme: '',
      isActive: true,
      createdAt: '',
      updatedAt: '',
      isEditing: true,
      isNew: true
    };

    this.clients.update(clients => [newClient, ...clients]);
  }

  // =========================
  // EDIT
  // =========================
  editRow(index: number) {
    const client = this.clients()[index];

    if (!client.isNew) {
      this.originalClients[client.id] = { ...client };
      this.editingClients.add(client.id);
    }

    this.clients.update(clients => {
      const updated = [...clients];
      updated[index] = { ...updated[index], isEditing: true };
      return updated;
    });
  }

  // =========================
  // SAVE
  // =========================
  saveRow(index: number) {
  const client = this.clients()[index];

  if (!client.nomComplet?.trim()) {
    this.errorMessage.set('Le nom complet est obligatoire');
    return;
  }

  this.isLoading.set(true);

  // ---------- CREATE ----------
  if (client.isNew) {
    const request: CreateClientRequest = {
      ref: client.ref?.trim() || null, // ✅ NULL au lieu de ""
      nomComplet: client.nomComplet.trim(),
      adresseLivraison: client.adresseLivraison,
      adresseFacturation: client.adresseFacturation,
      devise: client.devise,
      modeTransport: client.modeTransport,
      incoTerme: client.incoTerme
    };

    this.clientService.createClient(request).subscribe({
      next: () => {
        this.loadClients();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(err.error?.message || 'Erreur lors de la création');
        this.isLoading.set(false);
      }
    });

  // ---------- UPDATE ----------
  } else {
    const request: UpdateClientRequest = {
      ref: client.ref?.trim() || null, // ✅ NULL au lieu de ""
      nomComplet: client.nomComplet.trim(),
      adresseLivraison: client.adresseLivraison,
      adresseFacturation: client.adresseFacturation,
      devise: client.devise,
      modeTransport: client.modeTransport,
      incoTerme: client.incoTerme
    };

    this.clientService.updateClient(client.id, request).subscribe({
      next: (response) => {
        this.clients.update(clients => {
          const updated = [...clients];
          updated[index] = {
            ...response,
            isEditing: false,
            isNew: false
          };
          return updated;
        });
        delete this.originalClients[client.id];
        this.editingClients.delete(client.id);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(err.error?.message || 'Erreur lors de la mise à jour');
        this.isLoading.set(false);
      }
    });
  }
}


  // =========================
  // CANCEL
  // =========================
  cancelEdit(index: number) {
    const client = this.clients()[index];

    if (client.isNew) {
      this.clients.update(clients => clients.filter((_, i) => i !== index));
      return;
    }

    const original = this.originalClients[client.id];
    if (original) {
      this.clients.update(clients => {
        const updated = [...clients];
        updated[index] = { ...original, isEditing: false };
        return updated;
      });
      delete this.originalClients[client.id];
      this.editingClients.delete(client.id);
    }
  }

  // =========================
  // DELETE
  // =========================
  deleteRow(index: number) {
    const client = this.clients()[index];

    if (client.isNew) {
      this.clients.update(clients => clients.filter((_, i) => i !== index));
      return;
    }

    if (!confirm(`Supprimer le client "${client.nomComplet}" (Ref: ${client.ref}) ?`)) return;

    this.isLoading.set(true);
    this.clientService.deleteClient(client.id).subscribe({
      next: () => {
        this.loadClients();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erreur lors de la suppression');
        this.isLoading.set(false);
      }
    });
  }

  isEditing(client: ClientTable): boolean {
    return client.isEditing === true;
  }
}
