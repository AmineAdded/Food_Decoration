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
  searchNomComplet = signal('');
  searchModeTransport = signal('');
  searchIncoTerme = signal('');
  availableNomComplets = signal<string[]>([]);

  // ✅ PAGINATION
  currentPage = signal(1);
  itemsPerPage = 3;

  isLoading = signal(false);
  errorMessage = signal('');

  deviseOptions = ['USD', 'EUR', 'TND'];
  modeTransportOptions = ['Terrestre', 'Aérien', 'Maritime'];
  incoTermeOptions = ['EXW', 'DDU', 'DAP', 'DDP', 'FCA'];

  private originalClients: { [key: number]: ClientTable } = {};
  private editingClients: Set<number> = new Set();

  constructor(private clientService: ClientService) {}

  ngOnInit() {
    this.loadClients();
    this.loadDistinctNomComplets();
  }

  loadDistinctNomComplets() {
    this.clientService.getDistinctNomComplets().subscribe({
      next: (noms) => {
        this.availableNomComplets.set(noms);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des noms:', error);
      }
    });
  }

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
        this.currentPage.set(1); // ✅ Reset à la page 1
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set('Erreur lors du chargement des clients');
        this.isLoading.set(false);
      }
    });
  }

  performSearch() {
    const nomComplet = this.searchNomComplet();
    const modeTransport = this.searchModeTransport();
    const incoTerme = this.searchIncoTerme();

    if (!nomComplet && !modeTransport && !incoTerme) {
      this.loadClients();
      return;
    }

    this.isLoading.set(true);

    if (nomComplet) {
      this.clientService.searchByNomComplet(nomComplet).subscribe({
        next: (clients) => this.updateClients(clients),
        error: (error) => this.handleSearchError(error)
      });
    } else if (modeTransport) {
      this.clientService.searchByModeTransport(modeTransport).subscribe({
        next: (clients) => this.updateClients(clients),
        error: (error) => this.handleSearchError(error)
      });
    } else if (incoTerme) {
      this.clientService.searchByIncoTerme(incoTerme).subscribe({
        next: (clients) => this.updateClients(clients),
        error: (error) => this.handleSearchError(error)
      });
    }
  }

  private updateClients(clients: ClientResponse[]) {
    const mapped: ClientTable[] = clients.map(c => ({
      ...c,
      isEditing: false,
      isNew: false
    }));
    this.clients.set(mapped);
    this.currentPage.set(1); // ✅ Reset à la page 1
    this.isLoading.set(false);
  }

  private handleSearchError(error: any) {
    console.error(error);
    this.errorMessage.set('Erreur lors de la recherche');
    this.isLoading.set(false);
  }

  resetFilters() {
    this.searchTerm.set('');
    this.searchNomComplet.set('');
    this.searchModeTransport.set('');
    this.searchIncoTerme.set('');
    this.loadClients();
  }

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

  // ✅ PAGINATION: Clients paginés
  paginatedClients = computed(() => {
    const filtered = this.filteredClients();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  // ✅ PAGINATION: Nombre total de pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredClients().length / this.itemsPerPage);
  });

  // ✅ PAGINATION: Navigation
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  // ✅ PAGINATION: Array de numéros de pages
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }

    return pages;
  }

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
    this.currentPage.set(1); // ✅ Aller à la première page
  }

  editRow(index: number) {
    const client = this.paginatedClients()[index];
    const realIndex = this.clients().findIndex(c => c.id === client.id);

    if (!client.isNew) {
      this.originalClients[client.id] = { ...client };
      this.editingClients.add(client.id);
    }

    this.clients.update(clients => {
      const updated = [...clients];
      updated[realIndex] = { ...updated[realIndex], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
    const client = this.paginatedClients()[index];
    const realIndex = this.clients().findIndex(c => c.id === client.id);

    if (!client.nomComplet?.trim()) {
      this.errorMessage.set('Le nom complet est obligatoire');
      return;
    }

    this.isLoading.set(true);

    if (client.isNew) {
      const request: CreateClientRequest = {
        ref: client.ref?.trim() || null,
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
          this.loadDistinctNomComplets();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err.error?.message || 'Erreur lors de la création');
          this.isLoading.set(false);
        }
      });

    } else {
      const request: UpdateClientRequest = {
        ref: client.ref?.trim() || null,
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
            updated[realIndex] = {
              ...response,
              isEditing: false,
              isNew: false
            };
            return updated;
          });
          delete this.originalClients[client.id];
          this.editingClients.delete(client.id);
          this.loadDistinctNomComplets();
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

  cancelEdit(index: number) {
    const client = this.paginatedClients()[index];
    const realIndex = this.clients().findIndex(c => c.id === client.id);

    if (client.isNew) {
      this.clients.update(clients => clients.filter((_, i) => i !== realIndex));
      return;
    }

    const original = this.originalClients[client.id];
    if (original) {
      this.clients.update(clients => {
        const updated = [...clients];
        updated[realIndex] = { ...original, isEditing: false };
        return updated;
      });
      delete this.originalClients[client.id];
      this.editingClients.delete(client.id);
    }
  }

  deleteRow(index: number) {
    const client = this.paginatedClients()[index];
    const realIndex = this.clients().findIndex(c => c.id === client.id);

    if (client.isNew) {
      this.clients.update(clients => clients.filter((_, i) => i !== realIndex));
      return;
    }

    if (!confirm(`Supprimer le client "${client.nomComplet}" (Ref: ${client.ref}) ?`)) return;

    this.isLoading.set(true);
    this.clientService.deleteClient(client.id).subscribe({
      next: () => {
        this.loadClients();
        this.loadDistinctNomComplets();
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
