// frontend/src/app/components/process-table/process-table.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProcessService,
  ProcessResponse,
  CreateProcessRequest,
  UpdateProcessRequest
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
  styleUrl: './process-table.component.css'
})
export class ProcessTableComponent implements OnInit {

  process = signal<ProcessTable[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  private originalProcess: { [key: number]: ProcessTable } = {};
  private editingProcess: Set<number> = new Set();

  constructor(private processService: ProcessService) {}

  ngOnInit() {
    this.loadProcess();
  }

  loadProcess() {
    this.isLoading.set(true);
    this.processService.getAllProcess().subscribe({
      next: (process) => {
        const mapped: ProcessTable[] = process.map(p => ({
          ...p,
          isEditing: false,
          isNew: false
        }));
        this.process.set(mapped);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage.set('Erreur lors du chargement des process');
        this.isLoading.set(false);
      }
    });
  }

  filteredProcess = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.process();

    return this.process().filter(p =>
      p.ref?.toLowerCase().includes(term) ||
      p.nom?.toLowerCase().includes(term)
    );
  });

  addNewRow() {
    const newProcess: ProcessTable = {
      id: 0 as any,
      ref: '',
      nom: '',
      isActive: true,
      createdAt: '',
      updatedAt: '',
      isEditing: true,
      isNew: true
    };

    this.process.update(process => [newProcess, ...process]);
  }

  editRow(index: number) {
    const proc = this.process()[index];

    if (!proc.isNew) {
      this.originalProcess[proc.id] = { ...proc };
      this.editingProcess.add(proc.id);
    }

    this.process.update(process => {
      const updated = [...process];
      updated[index] = { ...updated[index], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
    const proc = this.process()[index];

    if (!proc.ref?.trim()) {
      this.errorMessage.set('La référence est obligatoire');
      return;
    }

    if (!proc.nom?.trim()) {
      this.errorMessage.set('Le nom est obligatoire');
      return;
    }

    this.isLoading.set(true);

    if (proc.isNew) {
      const request: CreateProcessRequest = {
        ref: proc.ref,
        nom: proc.nom
      };

      this.processService.createProcess(request).subscribe({
        next: () => {
          this.loadProcess();
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
        ref: proc.ref,
        nom: proc.nom
      };

      this.processService.updateProcess(proc.id, request).subscribe({
        next: (response) => {
          this.process.update(process => {
            const updated = [...process];
            updated[index] = {
              ...response,
              isEditing: false,
              isNew: false
            };
            return updated;
          });
          delete this.originalProcess[proc.id];
          this.editingProcess.delete(proc.id);
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
    const proc = this.process()[index];

    if (proc.isNew) {
      this.process.update(process => process.filter((_, i) => i !== index));
      return;
    }

    const original = this.originalProcess[proc.id];
    if (original) {
      this.process.update(process => {
        const updated = [...process];
        updated[index] = { ...original, isEditing: false };
        return updated;
      });
      delete this.originalProcess[proc.id];
      this.editingProcess.delete(proc.id);
    }
  }

  deleteRow(index: number) {
    const proc = this.process()[index];

    if (proc.isNew) {
      this.process.update(process => process.filter((_, i) => i !== index));
      return;
    }

    if (!confirm(`Supprimer le process "${proc.nom}" (Ref: ${proc.ref}) ?`)) return;

    this.isLoading.set(true);
    this.processService.deleteProcess(proc.id).subscribe({
      next: () => {
        this.loadProcess();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erreur lors de la suppression');
        this.isLoading.set(false);
      }
    });
  }

  isEditing(proc: ProcessTable): boolean {
    return proc.isEditing === true;
  }
}
