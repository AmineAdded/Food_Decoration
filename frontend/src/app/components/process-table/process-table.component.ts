// frontend/src/app/components/process-table/process-table.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProcessService,
  ProcessResponse,
  CreateProcessRequest,
  UpdateProcessRequest,
} from '../../services/process.service';

interface ProcessTable extends ProcessResponse {
  isEditing?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-process-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './process-table.component.html',
  styleUrl: './process-table.component.css',
})
export class ProcessTableComponent implements OnInit {
  process = signal<ProcessTable[]>([]);
  searchTerm = signal('');
  searchNomProcess = signal('');
  availableNomProcess = signal<string[]>([]);

  // ✅ PAGINATION
  currentPage = signal(1);
  itemsPerPage = 3;

  isLoading = signal(false);
  errorMessage = signal('');

  private originalProcess: { [key: number]: ProcessTable } = {};
  private editingProcess: Set<number> = new Set();

  constructor(private processService: ProcessService) {}

  ngOnInit() {
    this.loadProcess();
    this.loadDistinctNoms();
  }

  loadDistinctNoms() {
    this.processService.getDistinctNoms().subscribe({
      next: (noms) => {
        this.availableNomProcess.set(noms);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des noms:', error);
      }
    });
  }

  loadProcess() {
    this.isLoading.set(true);
    this.processService.getAllProcess().subscribe({
      next: (process) => {
        const mapped: ProcessTable[] = process.map((p) => ({
          ...p,
          isEditing: false,
          isNew: false,
        }));
        this.process.set(mapped);
        this.currentPage.set(1); // ✅ Reset à la page 1
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set('Erreur lors du chargement des process');
        this.isLoading.set(false);
      },
    });
  }

  performSearch() {
    const nomProcess = this.searchNomProcess();

    if (!nomProcess) {
      this.loadProcess();
      return;
    }

    this.isLoading.set(true);
    this.processService.searchByNom(nomProcess).subscribe({
      next: (process) => {
        const mapped: ProcessTable[] = process.map((p) => ({
          ...p,
          isEditing: false,
          isNew: false,
        }));
        this.process.set(mapped);
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
    this.searchNomProcess.set('');
    this.loadProcess();
  }

  filteredProcess = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.process();

    return this.process().filter(
      (p) => p.ref?.toLowerCase().includes(term) || p.nom?.toLowerCase().includes(term)
    );
  });

  // ✅ PAGINATION: Process paginés
  paginatedProcess = computed(() => {
    const filtered = this.filteredProcess();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  // ✅ PAGINATION: Nombre total de pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredProcess().length / this.itemsPerPage);
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
    const newProcess: ProcessTable = {
      id: 0 as any,
      ref: '',
      nom: '',
      isActive: true,
      createdAt: '',
      updatedAt: '',
      isEditing: true,
      isNew: true,
    };

    this.process.update((process) => [newProcess, ...process]);
    this.currentPage.set(1); // ✅ Aller à la première page
  }

  editRow(index: number) {
    const proc = this.paginatedProcess()[index];
    const realIndex = this.process().findIndex(p => p.id === proc.id);

    if (!proc.isNew) {
      this.originalProcess[proc.id] = { ...proc };
      this.editingProcess.add(proc.id);
    }

    this.process.update((process) => {
      const updated = [...process];
      updated[realIndex] = { ...updated[realIndex], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
    const proc = this.paginatedProcess()[index];
    const realIndex = this.process().findIndex(p => p.id === proc.id);

    if (!proc.nom?.trim()) {
      this.errorMessage.set('Le nom est obligatoire');
      return;
    }

    this.isLoading.set(true);

    if (proc.isNew) {
      const request: CreateProcessRequest = {
        ref: proc.ref?.trim() || null,
        nom: proc.nom.trim()
      };

      this.processService.createProcess(request).subscribe({
        next: () => {
          this.loadProcess();
          this.loadDistinctNoms();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set(err.error?.message || 'Erreur lors de la création');
          this.isLoading.set(false);
        }
      });

    } else {
      const request: UpdateProcessRequest = {
        ref: proc.ref?.trim() || null,
        nom: proc.nom.trim()
      };

      this.processService.updateProcess(proc.id, request).subscribe({
        next: (response) => {
          this.process.update(process => {
            const updated = [...process];
            updated[realIndex] = {
              ...response,
              isEditing: false,
              isNew: false
            };
            return updated;
          });
          delete this.originalProcess[proc.id];
          this.editingProcess.delete(proc.id);
          this.loadDistinctNoms();
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
    const proc = this.paginatedProcess()[index];
    const realIndex = this.process().findIndex(p => p.id === proc.id);

    if (proc.isNew) {
      this.process.update((process) => process.filter((_, i) => i !== realIndex));
      return;
    }

    const original = this.originalProcess[proc.id];
    if (original) {
      this.process.update((process) => {
        const updated = [...process];
        updated[realIndex] = { ...original, isEditing: false };
        return updated;
      });
      delete this.originalProcess[proc.id];
      this.editingProcess.delete(proc.id);
    }
  }

  deleteRow(index: number) {
    const proc = this.paginatedProcess()[index];
    const realIndex = this.process().findIndex(p => p.id === proc.id);

    if (proc.isNew) {
      this.process.update((process) => process.filter((_, i) => i !== realIndex));
      return;
    }

    const refText = proc.ref ? ` (Ref: ${proc.ref})` : '';
    if (!confirm(`Supprimer le process "${proc.nom}"${refText} ?`)) return;

    this.isLoading.set(true);
    this.processService.deleteProcess(proc.id).subscribe({
      next: () => {
        this.loadProcess();
        this.loadDistinctNoms();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erreur lors de la suppression');
        this.isLoading.set(false);
      },
    });
  }

  isEditing(proc: ProcessTable): boolean {
    return proc.isEditing === true;
  }
}
