// frontend/src/app/components/articles-table/articles-table.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProcessManagerComponent,
  ProcessDetail,
} from '../process-manager/process-manager.component';
import { ClientsManagerComponent } from '../clients-manager/clients-manager.component';
import { ClientService } from '../../services/client.service';
import {
  ArticleService,
  ArticleResponse,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '../../services/article.service';
import { CurrencyService } from '../../services/currency.service';

interface Article {
  id?: number;
  ref: string;
  article: string;
  famille: string;
  sousFamille: string;
  typeProcess: string;
  typeProduit: string;
  prixUnitaire: number; // Toujours stocké en TND
  mpq: number;
  stock: number;
  imageUrl?: string;
  imagePreview?: string;
  imageFile?: File;
  processes: ProcessDetail[];
  clients: string[];
  createdAt?: string;
  isEditing?: boolean;
  isNew?: boolean;
  displayCurrency?: 'EUR' | 'USD' | 'TND'; // Devise d'affichage
}

@Component({
  selector: 'app-articles-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ProcessManagerComponent, ClientsManagerComponent],
  templateUrl: './articles-table.component.html',
  styleUrl: './articles-table.component.css',
})
export class ArticlesTableComponent implements OnInit {
  articles = signal<Article[]>([]);
  availableClients = signal<string[]>([]);
  searchTerm = signal('');

  searchRef = signal('');
  searchNom = signal('');
  searchFamille = signal('');
  searchTypeProduit = signal('');
  searchTypeProcess = signal('');

  availableRefs = signal<string[]>([]);
  availableNoms = signal<string[]>([]);
  availableFamilles = signal<string[]>([]);
  availableTypeProduits = signal<string[]>([]);
  availableTypeProcess = signal<string[]>([]);

  currentPage = signal(1);
  itemsPerPage = 3;

  isLoading = signal(false);
  errorMessage = signal('');

  // Devises disponibles
  currencies: Array<'EUR' | 'USD' | 'TND'> = ['TND', 'EUR', 'USD'];

  private originalArticles: { [key: number]: Article } = {};
  private editingArticles: Set<number> = new Set();

  constructor(
    private clientService: ClientService,
    private articleService: ArticleService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.loadClients();
    this.loadArticles();
    this.loadDistinctValues();
  }

  loadClients() {
    this.clientService.getAllClientsSimple().subscribe({
      next: (clients) => {
        const sortedClients = clients
          .map((c) => c.nomComplet)
          .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
        this.availableClients.set(sortedClients);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients:', error);
        this.errorMessage.set('Erreur lors du chargement des clients');
      },
    });
  }

  loadDistinctValues() {
    this.articleService.getDistinctRefs().subscribe({
      next: (refs) => this.availableRefs.set(refs),
      error: (error) => console.error('Erreur refs:', error),
    });

    this.articleService.getDistinctNoms().subscribe({
      next: (noms) => this.availableNoms.set(noms),
      error: (error) => console.error('Erreur noms:', error),
    });

    this.articleService.getDistinctFamilles().subscribe({
      next: (familles) => this.availableFamilles.set(familles),
      error: (error) => console.error('Erreur familles:', error),
    });

    this.articleService.getDistinctTypeProduits().subscribe({
      next: (types) => this.availableTypeProduits.set(types),
      error: (error) => console.error('Erreur types produits:', error),
    });

    this.articleService.getDistinctTypeProcess().subscribe({
      next: (types) => this.availableTypeProcess.set(types),
      error: (error) => console.error('Erreur types process:', error),
    });
  }

  loadArticles() {
    this.isLoading.set(true);
    this.articleService.getAllArticles().subscribe({
      next: (articles) => {
        const mapped: Article[] = articles.map((a) => ({
          id: a.id,
          ref: a.ref,
          article: a.article,
          famille: a.famille || '',
          sousFamille: a.sousFamille || '',
          typeProcess: a.typeProcess || '',
          typeProduit: a.typeProduit || '',
          prixUnitaire: a.prixUnitaire || 0,
          mpq: a.mpq || 0,
          stock: a.stock || 0,
          imageUrl: a.imageUrl,
          processes: a.processes || [],
          clients: a.clients || [],
          createdAt: a.createdAt,
          isEditing: false,
          isNew: false,
          displayCurrency: 'TND', // Par défaut en TND
        }));
        mapped.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        this.articles.set(mapped);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des articles:', error);
        this.errorMessage.set('Erreur lors du chargement des articles');
        this.isLoading.set(false);
      },
    });
  }

  performSearch() {
    const ref = this.searchRef();
    const nom = this.searchNom();
    const famille = this.searchFamille();
    const typeProduit = this.searchTypeProduit();
    const typeProcess = this.searchTypeProcess();

    if (!ref && !nom && !famille && !typeProduit && !typeProcess) {
      this.loadArticles();
      return;
    }

    this.isLoading.set(true);
    let searchObservable;

    if (ref) {
      searchObservable = this.articleService.searchByRef(ref);
    } else if (nom) {
      searchObservable = this.articleService.searchByNom(nom);
    } else if (famille) {
      searchObservable = this.articleService.searchByFamille(famille);
    } else if (typeProduit) {
      searchObservable = this.articleService.searchByTypeProduit(typeProduit);
    } else {
      searchObservable = this.articleService.searchByTypeProcess(typeProcess);
    }

    searchObservable.subscribe({
      next: (articles) => {
        const mapped: Article[] = articles.map((a) => ({
          id: a.id,
          ref: a.ref,
          article: a.article,
          famille: a.famille || '',
          sousFamille: a.sousFamille || '',
          typeProcess: a.typeProcess || '',
          typeProduit: a.typeProduit || '',
          prixUnitaire: a.prixUnitaire || 0,
          mpq: a.mpq || 0,
          stock: a.stock || 0,
          imageUrl: a.imageUrl,
          processes: a.processes || [],
          clients: a.clients || [],
          createdAt: a.createdAt,
          isEditing: false,
          isNew: false,
          displayCurrency: 'TND',
        }));
        this.articles.set(mapped);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set('Erreur lors de la recherche');
        this.isLoading.set(false);
      },
    });
  }

  resetFilters() {
    this.searchTerm.set('');
    this.searchRef.set('');
    this.searchNom.set('');
    this.searchFamille.set('');
    this.searchTypeProduit.set('');
    this.searchTypeProcess.set('');
    this.loadArticles();
  }

  filteredArticles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.articles();

    return this.articles().filter(
      (article) =>
        article.ref?.toLowerCase().includes(term) ||
        article.article?.toLowerCase().includes(term) ||
        article.famille?.toLowerCase().includes(term) ||
        article.sousFamille?.toLowerCase().includes(term) ||
        article.typeProcess?.toLowerCase().includes(term) ||
        article.typeProduit?.toLowerCase().includes(term) ||
        article.stock?.toString().includes(term) ||
        article.clients.some((c) => c.toLowerCase().includes(term)) ||
        article.processes.some((p) => p.name.toLowerCase().includes(term))
    );
  });

  paginatedArticles = computed(() => {
    const filtered = this.filteredArticles();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredArticles().length / this.itemsPerPage);
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

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

  /**
   * Convertit et affiche le prix selon la devise sélectionnée
   */
  getConvertedPrice(article: Article): number {
    if (!article.displayCurrency) {
      article.displayCurrency = 'TND';
    }
    return this.currencyService.convertFromTND(article.prixUnitaire, article.displayCurrency);
  }

  /**
   * Formate le prix avec la devise
   */
  formatPrice(article: Article): string {
    const converted = this.getConvertedPrice(article);
    return this.currencyService.formatAmount(converted, article.displayCurrency || 'TND');
  }

  /**
   * Change la devise d'affichage pour un article
   */
  onCurrencyChange(index: number, currency: 'EUR' | 'USD' | 'TND') {
    const article = this.paginatedArticles()[index];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    this.articles.update((articles) => {
      const updated = [...articles];
      updated[realIndex].displayCurrency = currency;
      return updated;
    });
  }

  onImageSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Le fichier doit être une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set("L'image ne doit pas dépasser 5MB");
      return;
    }

    const article = this.paginatedArticles()[index];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.articles.update((articles) => {
        const updated = [...articles];
        updated[realIndex].imagePreview = e.target?.result as string;
        updated[realIndex].imageFile = file;
        return updated;
      });
    };
    reader.readAsDataURL(file);
  }

  removeImage(index: number) {
    const article = this.paginatedArticles()[index];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    this.articles.update((articles) => {
      const updated = [...articles];
      updated[realIndex].imagePreview = undefined;
      updated[realIndex].imageFile = undefined;
      updated[realIndex].imageUrl = undefined;
      return updated;
    });
  }

  // ✅ Crée une méthode pour obtenir l'URL de l'image (directement depuis imageUrl) :
  getArticleImageUrl(article: Article): string {
    // Si c'est une prévisualisation locale
    if (article.imagePreview) {
      return article.imagePreview;
    }
    // Si c'est une URL Cloudinary
    if (article.imageUrl) {
      return article.imageUrl;
    }
    // Sinon, image par défaut
    return 'assets/images/default-article.png';
  }

  calculateTotalTime(processes: ProcessDetail[]): number {
    return processes.reduce((sum, p) => sum + (p.tempsParPF || 0), 0);
  }

  getBottleneckInfo(processes: ProcessDetail[]): { processName: string; cadence: number } | null {
    if (processes.length === 0) return null;

    // Filtrer les process avec une cadence > 0
    const processesWithCadence = processes.filter((p) => p.cadenceMax > 0);

    if (processesWithCadence.length === 0) return null;

    // Trouver le process avec la cadence minimum
    const bottleneckProcess = processesWithCadence.reduce((min, current) =>
      current.cadenceMax < min.cadenceMax ? current : min
    );

    return {
      processName: bottleneckProcess.name,
      cadence: bottleneckProcess.cadenceMax,
    };
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '-';
    }
  }

  addNewRow() {
    const newArticle: Article = {
      ref: '',
      article: '',
      famille: '',
      sousFamille: '',
      typeProcess: '',
      typeProduit: '',
      prixUnitaire: 0,
      mpq: 0,
      stock: 0,
      processes: [],
      clients: [],
      isEditing: true,
      isNew: true,
      displayCurrency: 'TND',
    };

    this.articles.update((articles) => [newArticle, ...articles]);
    this.currentPage.set(1);
  }

  editRow(index: number) {
    const article = this.paginatedArticles()[index];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    if (!article.isNew && article.id) {
      this.originalArticles[article.id] = JSON.parse(JSON.stringify(article));
      this.editingArticles.add(article.id);
    }

    this.articles.update((articles) => {
      const updated = [...articles];
      updated[realIndex] = { ...updated[realIndex], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
    const article = this.paginatedArticles()[index];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    if (!article.ref?.trim()) {
      this.errorMessage.set('La référence est obligatoire');
      return;
    }

    if (!article.article?.trim()) {
      this.errorMessage.set("Le nom de l'article est obligatoire");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (article.isNew) {
      const request: CreateArticleRequest = {
        ref: article.ref,
        article: article.article,
        famille: article.famille || '',
        sousFamille: article.sousFamille || '',
        typeProcess: article.typeProcess || '',
        typeProduit: article.typeProduit || '',
        prixUnitaire: article.prixUnitaire || 0,
        mpq: article.mpq || 0,
        stock: article.stock || 0,
        clients: article.clients || [],
        processes: article.processes || [],
      };

      this.articleService.createArticle(request).subscribe({
        next: (response) => {
          if (article.imageFile) {
            this.articleService.uploadImage(response.id, article.imageFile).subscribe({
              next: () => {
                this.loadArticles();
                this.loadDistinctValues();
                this.isLoading.set(false);
              },
              error: (err) => {
                this.errorMessage.set("Article créé mais erreur lors de l'upload de l'image");
                this.loadArticles();
                this.loadDistinctValues();
                this.isLoading.set(false);
              },
            });
          } else {
            this.loadArticles();
            this.loadDistinctValues();
            this.isLoading.set(false);
          }
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Erreur lors de la création');
          this.isLoading.set(false);
        },
      });
    } else if (article.id) {
      const request: UpdateArticleRequest = {
        ref: article.ref,
        article: article.article,
        famille: article.famille || '',
        sousFamille: article.sousFamille || '',
        typeProcess: article.typeProcess || '',
        typeProduit: article.typeProduit || '',
        prixUnitaire: article.prixUnitaire || 0,
        mpq: article.mpq || 0,
        stock: article.stock || 0,
        clients: article.clients || [],
        processes: article.processes || [],
      };

      this.articleService.updateArticle(article.id, request).subscribe({
        next: () => {
          if (article.imageFile) {
            this.articleService.uploadImage(article.id!, article.imageFile).subscribe({
              next: () => {
                this.loadArticles();
                this.loadDistinctValues();
                this.isLoading.set(false);
              },
              error: () => {
                this.loadArticles();
                this.loadDistinctValues();
                this.isLoading.set(false);
              },
            });
            console.log('📸 Image URL:', article.imageUrl);
          } else if (!article.imagePreview && !article.imageUrl) {
            this.articleService.deleteImage(article.id!).subscribe({
              next: () => {
                this.loadArticles();
                this.loadDistinctValues();
                this.isLoading.set(false);
              },
              error: () => {
                this.loadArticles();
                this.loadDistinctValues();
                this.isLoading.set(false);
              },
            });
          } else {
            this.loadArticles();
            this.loadDistinctValues();
            this.isLoading.set(false);
          }
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Erreur lors de la mise à jour');
          this.isLoading.set(false);
        },
      });
    }
  }
  // Méthode pour gérer les erreurs de chargement d'image
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-article.png';
    img.style.opacity = '0.5';
  }

  cancelEdit(index: number) {
    const article = this.paginatedArticles()[index];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    if (article.isNew) {
      this.articles.update((articles) => articles.filter((_, i) => i !== realIndex));
      return;
    }

    if (article.id) {
      const original = this.originalArticles[article.id];
      if (original) {
        this.articles.update((articles) => {
          const updated = [...articles];
          updated[realIndex] = { ...original, isEditing: false };
          return updated;
        });
        delete this.originalArticles[article.id];
        this.editingArticles.delete(article.id);
      }
    }
  }

  deleteRow(index: number) {
    const article = this.paginatedArticles()[index];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    if (article.isNew) {
      this.articles.update((articles) => articles.filter((_, i) => i !== realIndex));
      return;
    }

    if (!article.id) return;

    if (!confirm(`Supprimer l'article "${article.article}" (Ref: ${article.ref}) ?`)) return;

    this.isLoading.set(true);
    this.articleService.deleteArticle(article.id).subscribe({
      next: () => {
        this.loadArticles();
        this.loadDistinctValues();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erreur lors de la suppression');
        this.isLoading.set(false);
      },
    });
  }

  updateClients(articleIndex: number, clients: string[]) {
    const article = this.paginatedArticles()[articleIndex];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    this.articles.update((articles) => {
      const updated = [...articles];
      updated[realIndex].clients = clients;
      return updated;
    });
  }

  updateProcesses(articleIndex: number, processes: ProcessDetail[]) {
    const article = this.paginatedArticles()[articleIndex];
    const realIndex = this.articles().findIndex((a) => a.id === article.id);

    this.articles.update((articles) => {
      const updated = [...articles];
      updated[realIndex].processes = processes;
      return updated;
    });
  }
}
