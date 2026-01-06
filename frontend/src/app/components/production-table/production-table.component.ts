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

  sortOrder = signal<SortOrder>(null);

  // ✅ PAGINATION
  currentPage = signal(1);
  itemsPerPage = 3;

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
        mapped.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        this.productions.set(mapped);
        this.currentPage.set(1); // ✅ Reset à la page 1
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

  toggleSort() {
    const currentOrder = this.sortOrder();

    if (currentOrder === null) {
      this.sortOrder.set('desc');
    } else if (currentOrder === 'desc') {
      this.sortOrder.set('asc');
    } else {
      this.sortOrder.set(null);
    }
  }

  filteredProductions = computed(() => {
    let filtered = this.productions();
    const term = this.searchTerm().toLowerCase();
    const articleRef = this.searchArticleRef();
    const date = this.searchDate();
    const year = this.searchYear();
    const month = this.searchMonth();

    if (term) {
      filtered = filtered.filter(p =>
        p.articleRef?.toLowerCase().includes(term) ||
        p.articleNom?.toLowerCase().includes(term) ||
        p.quantite?.toString().includes(term)
      );
    }

    if (articleRef) {
      filtered = filtered.filter(p => p.articleRef === articleRef);
    }

    if (date) {
      filtered = filtered.filter(p => p.dateProduction === date);
    }

    if (year) {
      filtered = filtered.filter(p => {
        const prodYear = new Date(p.dateProduction).getFullYear();
        return prodYear === year;
      });
    }

    if (month) {
      filtered = filtered.filter(p => {
        const prodMonth = new Date(p.dateProduction).getMonth() + 1;
        return prodMonth === month;
      });
    }

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

  // ✅ PAGINATION: Productions paginées
  paginatedProductions = computed(() => {
    const filtered = this.filteredProductions();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  // ✅ PAGINATION: Nombre total de pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredProductions().length / this.itemsPerPage);
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
        this.currentPage.set(1); // ✅ Reset à la page 1
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
        this.currentPage.set(1); // ✅ Reset à la page 1
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
    this.sortOrder.set(null);
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
    this.currentPage.set(1); // ✅ Aller à la première page
  }

  editRow(index: number) {
    const prod = this.paginatedProductions()[index];
    const realIndex = this.productions().findIndex(p => p.id === prod.id);

    if (!prod.isNew) {
      this.originalProductions[prod.id] = { ...prod };
      this.editingProductions.add(prod.id);
    }

    this.productions.update(productions => {
      const updated = [...productions];
      updated[realIndex] = { ...updated[realIndex], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
    const prod = this.paginatedProductions()[index];
    const realIndex = this.productions().findIndex(p => p.id === prod.id);

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
            updated[realIndex] = {
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
    const prod = this.paginatedProductions()[index];
    const realIndex = this.productions().findIndex(p => p.id === prod.id);

    if (prod.isNew) {
      this.productions.update(productions => productions.filter((_, i) => i !== realIndex));
      return;
    }

    const original = this.originalProductions[prod.id];
    if (original) {
      this.productions.update(productions => {
        const updated = [...productions];
        updated[realIndex] = { ...original, isEditing: false };
        return updated;
      });
      delete this.originalProductions[prod.id];
      this.editingProductions.delete(prod.id);
    }
  }

  deleteRow(index: number) {
    const prod = this.paginatedProductions()[index];
    const realIndex = this.productions().findIndex(p => p.id === prod.id);

    if (prod.isNew) {
      this.productions.update(productions => productions.filter((_, i) => i !== realIndex));
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
