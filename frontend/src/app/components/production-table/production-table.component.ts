// frontend/src/app/components/production-table/production-table.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProductionService,
  ProductionResponse,
  CreateProductionRequest,
  UpdateProductionRequest
} from '../../services/production.service';
import { ArticleService } from '../../services/article.service';

interface ProductionTable extends ProductionResponse {
  isEditing?: boolean;
  isNew?: boolean;
}

type SortOrder = 'asc' | 'desc' | null;

@Component({
  selector: 'app-production-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './production-table.component.html',
  styleUrl: './production-table.component.css'
})
export class ProductionTableComponent implements OnInit {

  productions = signal<ProductionTable[]>([]);
  availableArticles = signal<{ref: string, nom: string}[]>([]);

  searchTerm = signal('');
  searchArticleRef = signal('');
  searchDate = signal('');
  searchYear = signal<number | null>(null);
  searchMonth = signal<number | null>(null);

  // ✅ NOUVEAU: État du tri
  sortOrder = signal<SortOrder>(null);

  isLoading = signal(false);
  errorMessage = signal('');

  private originalProductions: { [key: number]: ProductionTable } = {};
  private editingProductions: Set<number> = new Set();

  constructor(
    private productionService: ProductionService,
    private articleService: ArticleService
  ) {}

  ngOnInit() {
    this.loadProductions();
    this.loadArticles();
  }

  loadProductions() {
  this.isLoading.set(true);
  this.productionService.getAllProductions().subscribe({
    next: (productions) => {
      const mapped: ProductionTable[] = productions.map(p => ({
        ...p,
        isEditing: false,
        isNew: false
      }));
      // ✅ Trier par date de création décroissante (plus récent en premier)
      mapped.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Ordre décroissant
      });
      this.productions.set(mapped);
      this.isLoading.set(false);
    },
    error: (error) => {
      console.error(error);
      this.errorMessage.set('Erreur lors du chargement des productions');
      this.isLoading.set(false);
    }
  });
}

  loadArticles() {
    this.articleService.getAllArticles().subscribe({
      next: (articles) => {
        const mapped = articles.map(a => ({
          ref: a.ref,
          nom: a.article
        }));
        this.availableArticles.set(mapped);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des articles:', error);
      }
    });
  }

  // ✅ NOUVEAU: Fonction de tri
  toggleSort() {
    const currentOrder = this.sortOrder();

    if (currentOrder === null) {
      this.sortOrder.set('desc'); // Premier clic: descendant (plus récent d'abord)
    } else if (currentOrder === 'desc') {
      this.sortOrder.set('asc'); // Deuxième clic: ascendant (plus ancien d'abord)
    } else {
      this.sortOrder.set(null); // Troisième clic: retour à l'ordre par défaut
    }
  }

  // ✅ MODIFIÉ: Recherche avec tri
  filteredProductions = computed(() => {
    let filtered = this.productions();
    const term = this.searchTerm().toLowerCase();
    const articleRef = this.searchArticleRef();
    const date = this.searchDate();
    const year = this.searchYear();
    const month = this.searchMonth();

    // Filtre par terme de recherche (ref, nom, quantité)
    if (term) {
      filtered = filtered.filter(p =>
        p.articleRef?.toLowerCase().includes(term) ||
        p.articleNom?.toLowerCase().includes(term) ||
        p.quantite?.toString().includes(term)
      );
    }

    // Filtre par référence d'article
    if (articleRef) {
      filtered = filtered.filter(p => p.articleRef === articleRef);
    }

    // Filtre par date exacte
    if (date) {
      filtered = filtered.filter(p => p.dateProduction === date);
    }

    // Filtre par année
    if (year) {
      filtered = filtered.filter(p => {
        const prodYear = new Date(p.dateProduction).getFullYear();
        return prodYear === year;
      });
    }

    // Filtre par mois
    if (month) {
      filtered = filtered.filter(p => {
        const prodMonth = new Date(p.dateProduction).getMonth() + 1;
        return prodMonth === month;
      });
    }

    // ✅ NOUVEAU: Appliquer le tri
    const order = this.sortOrder();
    if (order !== null) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.dateProduction).getTime();
        const dateB = new Date(b.dateProduction).getTime();

        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  });

  searchByArticle() {
    const ref = this.searchArticleRef();
    if (!ref) {
      this.loadProductions();
      return;
    }

    this.isLoading.set(true);
    this.productionService.searchByArticleRef(ref).subscribe({
      next: (productions) => {
        const mapped: ProductionTable[] = productions.map(p => ({
          ...p,
          isEditing: false,
          isNew: false
        }));
        this.productions.set(mapped);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set('Erreur lors de la recherche');
        this.isLoading.set(false);
      }
    });
  }

  searchByDateFilter() {
    const date = this.searchDate();
    if (!date) {
      this.loadProductions();
      return;
    }

    this.isLoading.set(true);
    this.productionService.searchByDate(date).subscribe({
      next: (productions) => {
        const mapped: ProductionTable[] = productions.map(p => ({
          ...p,
          isEditing: false,
          isNew: false
        }));
        this.productions.set(mapped);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set('Erreur lors de la recherche');
        this.isLoading.set(false);
      }
    });
  }

  resetFilters() {
    this.searchTerm.set('');
    this.searchArticleRef.set('');
    this.searchDate.set('');
    this.searchYear.set(null);
    this.searchMonth.set(null);
    this.sortOrder.set(null); // ✅ Réinitialiser le tri
    this.loadProductions();
  }

  addNewRow() {
    const today = new Date().toISOString().split('T')[0];
    const newProduction: ProductionTable = {
      id: 0 as any,
      articleRef: '',
      articleNom: '',
      quantite: 1,
      dateProduction: today,
      stockActuel: 0,
      isActive: true,
      createdAt: '',
      updatedAt: '',
      isEditing: true,
      isNew: true
    };

    this.productions.update(productions => [newProduction, ...productions]);
  }

  editRow(index: number) {
    const prod = this.productions()[index];

    if (!prod.isNew) {
      this.originalProductions[prod.id] = { ...prod };
      this.editingProductions.add(prod.id);
    }

    this.productions.update(productions => {
      const updated = [...productions];
      updated[index] = { ...updated[index], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
    const prod = this.productions()[index];

    if (!prod.articleRef?.trim()) {
      this.errorMessage.set('La référence de l\'article est obligatoire');
      return;
    }

    if (!prod.quantite || prod.quantite < 1) {
      this.errorMessage.set('La quantité doit être au moins 1');
      return;
    }

    if (!prod.dateProduction) {
      this.errorMessage.set('La date de production est obligatoire');
      return;
    }

    this.isLoading.set(true);

    if (prod.isNew) {
      const request: CreateProductionRequest = {
        articleRef: prod.articleRef,
        quantite: prod.quantite,
        dateProduction: prod.dateProduction
      };

      this.productionService.createProduction(request).subscribe({
        next: () => {
          this.loadProductions();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err.error?.message || 'Erreur lors de la création');
          this.isLoading.set(false);
        }
      });

    } else {
      const request: UpdateProductionRequest = {
        articleRef: prod.articleRef,
        quantite: prod.quantite,
        dateProduction: prod.dateProduction
      };

      this.productionService.updateProduction(prod.id, request).subscribe({
        next: (response) => {
          this.productions.update(productions => {
            const updated = [...productions];
            updated[index] = {
              ...response,
              isEditing: false,
              isNew: false
            };
            return updated;
          });
          delete this.originalProductions[prod.id];
          this.editingProductions.delete(prod.id);
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
    const prod = this.productions()[index];

    if (prod.isNew) {
      this.productions.update(productions => productions.filter((_, i) => i !== index));
      return;
    }

    const original = this.originalProductions[prod.id];
    if (original) {
      this.productions.update(productions => {
        const updated = [...productions];
        updated[index] = { ...original, isEditing: false };
        return updated;
      });
      delete this.originalProductions[prod.id];
      this.editingProductions.delete(prod.id);
    }
  }

  deleteRow(index: number) {
    const prod = this.productions()[index];

    if (prod.isNew) {
      this.productions.update(productions => productions.filter((_, i) => i !== index));
      return;
    }

    if (!confirm(`Supprimer la production de ${prod.quantite} unités de "${prod.articleNom}" (${prod.dateProduction}) ?`)) return;

    this.isLoading.set(true);
    this.productionService.deleteProduction(prod.id).subscribe({
      next: () => {
        this.loadProductions();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erreur lors de la suppression');
        this.isLoading.set(false);
      }
    });
  }

  isEditing(prod: ProductionTable): boolean {
    return prod.isEditing === true;
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
    const article = this.availableArticles().find(a => a.ref === ref);
    return article ? article.nom : '';
  }

  exportToExcel() {
    this.isLoading.set(true);

    const articleRef = this.searchArticleRef() || undefined;
    const date = this.searchDate() || undefined;

    this.productionService.exportToExcel(articleRef, date).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const today = new Date().toISOString().split('T')[0];
        link.download = `productions_${today}.xlsx`;

        link.click();
        window.URL.revokeObjectURL(url);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de l\'export:', error);
        this.errorMessage.set('Erreur lors de l\'export Excel');
        this.isLoading.set(false);
      }
    });
  }
}
