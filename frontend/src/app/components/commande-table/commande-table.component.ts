// frontend/src/app/components/commande-table/commande-table.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CommandeService,
  CommandeResponse,
  CreateCommandeRequest,
  UpdateCommandeRequest,
  CommandeSummaryResponse,
} from '../../services/commande.service';
import { ArticleService } from '../../services/article.service';
import { ClientService } from '../../services/client.service';

interface CommandeTable extends CommandeResponse {
  isEditing?: boolean;
  isNew?: boolean;
}

type DateType = 'souhaitee' | 'ajout';
type SearchMode = 'date' | 'periode';
type SortColumn = 'dateSouhaitee' | 'dateAjout' | null;
type SortOrder = 'asc' | 'desc' | null;

@Component({
  selector: 'app-commande-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commande-table.component.html',
  styleUrl: './commande-table.component.css',
})
export class CommandeTableComponent implements OnInit {
  commandes = signal<CommandeTable[]>([]);
  availableArticles = signal<{ ref: string; nom: string }[]>([]);
  availableClients = signal<string[]>([]);

  searchTerm = signal('');
  searchArticleRef = signal('');
  searchClientNom = signal('');
  searchTypeDate = signal<DateType>('souhaitee');
  searchMode = signal<SearchMode>('date');

  searchDate = signal('');
  searchDateDebut = signal('');
  searchDateFin = signal('');

  summary = signal<CommandeSummaryResponse | null>(null);

  // ✅ NOUVEAU: États du tri
  sortColumn = signal<SortColumn>(null);
  sortOrder = signal<SortOrder>(null);

  isLoading = signal(false);
  errorMessage = signal('');

  private originalCommandes: { [key: number]: CommandeTable } = {};
  private editingCommandes: Set<number> = new Set();

  constructor(
    private commandeService: CommandeService,
    private articleService: ArticleService,
    private clientService: ClientService
  ) {}

  ngOnInit() {
    this.loadCommandes();
    this.loadArticles();
    this.loadClients();
  }

  loadCommandes() {
    this.isLoading.set(true);
    this.commandeService.getAllCommandes().subscribe({
      next: (commandes) => {
        const mapped: CommandeTable[] = commandes.map((c) => ({
          ...c,
          isEditing: false,
          isNew: false,
        }));
        this.commandes.set(mapped);
        this.summary.set(null);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set('Erreur lors du chargement des commandes');
        this.isLoading.set(false);
      },
    });
  }

  loadArticles() {
    this.articleService.getAllArticles().subscribe({
      next: (articles) => {
        const mapped = articles.map((a) => ({
          ref: a.ref,
          nom: a.article,
        }));
        this.availableArticles.set(mapped);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des articles:', error);
      },
    });
  }

  loadClients() {
    this.clientService.getAllClientsSimple().subscribe({
      next: (clients) => {
        const mapped = clients.map((c) => c.nomComplet);
        this.availableClients.set(mapped);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients:', error);
      },
    });
  }

  // ✅ NOUVEAU: Fonction de tri
  toggleSort(column: 'dateSouhaitee' | 'dateAjout') {
    const currentColumn = this.sortColumn();
    const currentOrder = this.sortOrder();

    if (currentColumn !== column) {
      // Nouvelle colonne sélectionnée: tri descendant
      this.sortColumn.set(column);
      this.sortOrder.set('desc');
    } else {
      // Même colonne: changer l'ordre
      if (currentOrder === 'desc') {
        this.sortOrder.set('asc');
      } else if (currentOrder === 'asc') {
        this.sortColumn.set(null);
        this.sortOrder.set(null);
      } else {
        this.sortOrder.set('desc');
      }
    }
  }

  // ✅ MODIFIÉ: Recherche avec tri
  filteredCommandes = computed(() => {
    let filtered = this.commandes();
    const term = this.searchTerm().toLowerCase();

    if (term) {
      filtered = filtered.filter(
        (c) =>
          c.articleRef?.toLowerCase().includes(term) ||
          c.articleNom?.toLowerCase().includes(term) ||
          c.clientNom?.toLowerCase().includes(term) ||
          c.quantite?.toString().includes(term)
      );
    }

    // ✅ NOUVEAU: Appliquer le tri
    const column = this.sortColumn();
    const order = this.sortOrder();

    if (column && order) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a[column]).getTime();
        const dateB = new Date(b[column]).getTime();

        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  });

  performSearch() {
    const articleRef = this.searchArticleRef();
    const mode = this.searchMode();
    const typeDate = this.searchTypeDate();

    if (!articleRef && !this.hasDateFilter()) {
      this.loadCommandes();
      return;
    }

    this.isLoading.set(true);

    if (articleRef && mode === 'periode' && this.searchDateDebut() && this.searchDateFin()) {
      const searchObservable =
        typeDate === 'souhaitee'
          ? this.commandeService.searchByArticleRefAndPeriodeSouhaitee(
              articleRef,
              this.searchDateDebut(),
              this.searchDateFin()
            )
          : this.commandeService.searchByArticleRefAndPeriodeAjout(
              articleRef,
              this.searchDateDebut(),
              this.searchDateFin()
            );

      searchObservable.subscribe({
        next: (commandes) => {
          this.updateCommandes(commandes);
          this.loadSummary();
          this.isLoading.set(false);
        },
        error: (error) => this.handleSearchError(error),
      });
      return;
    }

    if (articleRef && mode === 'date' && this.searchDate()) {
      const searchObservable =
        typeDate === 'souhaitee'
          ? this.commandeService.searchByArticleRefAndDateSouhaitee(articleRef, this.searchDate())
          : this.commandeService.searchByArticleRefAndDateAjout(articleRef, this.searchDate());

      searchObservable.subscribe({
        next: (commandes) => {
          this.updateCommandes(commandes);
          this.loadSummary();
          this.isLoading.set(false);
        },
        error: (error) => this.handleSearchError(error),
      });
      return;
    }

    if (articleRef && !this.hasDateFilter()) {
      this.commandeService.searchByArticleRef(articleRef).subscribe({
        next: (commandes) => {
          this.updateCommandes(commandes);
          this.loadSummary();
          this.isLoading.set(false);
        },
        error: (error) => this.handleSearchError(error),
      });
      return;
    }

    if (!articleRef && mode === 'date' && this.searchDate()) {
      const searchObservable =
        typeDate === 'souhaitee'
          ? this.commandeService.searchByDateSouhaitee(this.searchDate())
          : this.commandeService.searchByDateAjout(this.searchDate());

      searchObservable.subscribe({
        next: (commandes) => {
          this.updateCommandes(commandes);
          this.summary.set(null);
          this.isLoading.set(false);
        },
        error: (error) => this.handleSearchError(error),
      });
      return;
    }

    this.loadCommandes();
  }

  hasDateFilter(): boolean {
    if (this.searchMode() === 'date') {
      return !!this.searchDate();
    } else {
      return !!(this.searchDateDebut() && this.searchDateFin());
    }
  }

  loadSummary() {
    const articleRef = this.searchArticleRef();
    const mode = this.searchMode();
    const typeDate = this.searchTypeDate();

    if (!articleRef) {
      this.summary.set(null);
      return;
    }

    if (mode === 'periode' && this.searchDateDebut() && this.searchDateFin()) {
      const summaryObservable =
        typeDate === 'souhaitee'
          ? this.commandeService.getSummaryByArticleRefAndPeriodeSouhaitee(
              articleRef,
              this.searchDateDebut(),
              this.searchDateFin()
            )
          : this.commandeService.getSummaryByArticleRefAndPeriodeAjout(
              articleRef,
              this.searchDateDebut(),
              this.searchDateFin()
            );

      summaryObservable.subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error) => console.error('Erreur sommaire:', error),
      });
      return;
    }

    if (mode === 'date' && this.searchDate()) {
      const summaryObservable =
        typeDate === 'souhaitee'
          ? this.commandeService.getSummaryByArticleRefAndDateSouhaitee(
              articleRef,
              this.searchDate()
            )
          : this.commandeService.getSummaryByArticleRefAndDateAjout(articleRef, this.searchDate());

      summaryObservable.subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error) => console.error('Erreur sommaire:', error),
      });
      return;
    }

    this.commandeService.getSummaryByArticleRef(articleRef).subscribe({
      next: (summary) => this.summary.set(summary),
      error: (error) => console.error('Erreur sommaire:', error),
    });
  }

  private updateCommandes(commandes: CommandeResponse[]) {
    const mapped: CommandeTable[] = commandes.map((c) => ({
      ...c,
      isEditing: false,
      isNew: false,
    }));
    this.commandes.set(mapped);
  }

  private handleSearchError(error: any) {
    console.error(error);
    this.errorMessage.set('Erreur lors de la recherche');
    this.isLoading.set(false);
  }

  resetFilters() {
    this.searchTerm.set('');
    this.searchArticleRef.set('');
    this.searchClientNom.set('');
    this.searchDate.set('');
    this.searchDateDebut.set('');
    this.searchDateFin.set('');
    this.searchMode.set('date');
    this.searchTypeDate.set('souhaitee');
    this.sortColumn.set(null); // ✅ Réinitialiser le tri
    this.sortOrder.set(null);
    this.summary.set(null);
    this.loadCommandes();
  }

  searchByClient() {
    const nom = this.searchClientNom();
    if (!nom) {
      this.loadCommandes();
      return;
    }

    this.isLoading.set(true);
    this.commandeService.searchByClientNom(nom).subscribe({
      next: (commandes) => {
        this.updateCommandes(commandes);
        this.summary.set(null);
        this.isLoading.set(false);
      },
      error: (error) => this.handleSearchError(error),
    });
  }

  exportToExcel() {
    this.isLoading.set(true);

    const articleRef = this.searchArticleRef() || undefined;
    const dateType = this.searchTypeDate();
    const mode = this.searchMode();

    let date: string | undefined;
    let dateDebut: string | undefined;
    let dateFin: string | undefined;

    if (mode === 'date' && this.searchDate()) {
      date = this.searchDate();
    } else if (mode === 'periode' && this.searchDateDebut() && this.searchDateFin()) {
      dateDebut = this.searchDateDebut();
      dateFin = this.searchDateFin();
    }

    this.commandeService.exportToExcel(articleRef, dateType, date, dateDebut, dateFin).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const today = new Date().toISOString().split('T')[0];
        link.download = `commandes_${today}.xlsx`;

        link.click();
        window.URL.revokeObjectURL(url);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error("Erreur lors de l'export:", error);
        this.errorMessage.set("Erreur lors de l'export Excel");
        this.isLoading.set(false);
      },
    });
  }

  addNewRow() {
    const today = new Date().toISOString().split('T')[0];
    const newCommande: CommandeTable = {
      id: 0 as any,
      articleRef: '',
      articleNom: '',
      numeroCommandeClient: '',
      clientNom: '',
      quantite: 1,
      typeCommande: 'PLANIFIEE',
      dateSouhaitee: today,
      dateAjout: today,
      isActive: true,
      createdAt: '',
      updatedAt: '',
      isEditing: true,
      isNew: true,
      quantiteNonLivree: 0
    };

    this.commandes.update((commandes) => [newCommande, ...commandes]);
  }

  editRow(index: number) {
    const cmd = this.commandes()[index];

    if (!cmd.isNew) {
      this.originalCommandes[cmd.id] = { ...cmd };
      this.editingCommandes.add(cmd.id);
    }

    this.commandes.update((commandes) => {
      const updated = [...commandes];
      updated[index] = { ...updated[index], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
    const cmd = this.commandes()[index];

    if (!cmd.articleRef?.trim()) {
      this.errorMessage.set("La référence de l'article est obligatoire");
      return;
    }

    if (!cmd.numeroCommandeClient?.trim()) {
      this.errorMessage.set('Le numéro de commande client est obligatoire');
      return;
    }

    if (!cmd.clientNom?.trim()) {
      this.errorMessage.set('Le nom du client est obligatoire');
      return;
    }

    if (!cmd.quantite || cmd.quantite < 1) {
      this.errorMessage.set('La quantité doit être au moins 1');
      return;
    }

     if (!cmd.typeCommande) {
      this.errorMessage.set('Le type de commande est obligatoire');
      return;
    }

    if (!cmd.dateSouhaitee) {
      this.errorMessage.set('La date souhaitée est obligatoire');
      return;
    }

    this.isLoading.set(true);

    if (cmd.isNew) {
      const request: CreateCommandeRequest = {
        articleRef: cmd.articleRef,
        numeroCommandeClient: cmd.numeroCommandeClient,
        clientNom: cmd.clientNom,
        quantite: cmd.quantite,
        typeCommande: cmd.typeCommande,
        dateSouhaitee: cmd.dateSouhaitee,
      };

      this.commandeService.createCommande(request).subscribe({
        next: () => {
          this.performSearch();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err.error?.message || 'Erreur lors de la création');
          this.isLoading.set(false);
        },
      });
    } else {
      const request: UpdateCommandeRequest = {
        articleRef: cmd.articleRef,
        numeroCommandeClient: cmd.numeroCommandeClient,
        clientNom: cmd.clientNom,
        quantite: cmd.quantite,
        typeCommande: cmd.typeCommande,
        dateSouhaitee: cmd.dateSouhaitee,
      };

      this.commandeService.updateCommande(cmd.id, request).subscribe({
        next: (response) => {
          this.commandes.update((commandes) => {
            const updated = [...commandes];
            updated[index] = {
              ...response,
              isEditing: false,
              isNew: false,
            };
            return updated;
          });
          delete this.originalCommandes[cmd.id];
          this.editingCommandes.delete(cmd.id);
          this.loadSummary();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err.error?.message || 'Erreur lors de la mise à jour');
          this.isLoading.set(false);
        },
      });
    }
  }

  cancelEdit(index: number) {
    const cmd = this.commandes()[index];

    if (cmd.isNew) {
      this.commandes.update((commandes) => commandes.filter((_, i) => i !== index));
      return;
    }

    const original = this.originalCommandes[cmd.id];
    if (original) {
      this.commandes.update((commandes) => {
        const updated = [...commandes];
        updated[index] = { ...original, isEditing: false };
        return updated;
      });
      delete this.originalCommandes[cmd.id];
      this.editingCommandes.delete(cmd.id);
    }
  }

  deleteRow(index: number) {
    const cmd = this.commandes()[index];

    if (cmd.isNew) {
      this.commandes.update((commandes) => commandes.filter((_, i) => i !== index));
      return;
    }

    if (
      !confirm(
        `Supprimer la commande de ${cmd.quantite} unités de "${cmd.articleNom}" pour ${cmd.clientNom} ?`
      )
    )
      return;

    this.isLoading.set(true);
    this.commandeService.deleteCommande(cmd.id).subscribe({
      next: () => {
        this.performSearch();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erreur lors de la suppression');
        this.isLoading.set(false);
      },
    });
  }

  isEditing(cmd: CommandeTable): boolean {
    return cmd.isEditing === true;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getArticleNomFromRef(ref: string): string {
    const article = this.availableArticles().find((a) => a.ref === ref);
    return article ? article.nom : '';
  }
}
