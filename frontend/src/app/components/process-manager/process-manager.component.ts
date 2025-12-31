// frontend/src/app/components/process-manager/process-manager.component.ts
import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessService, ProcessSimpleResponse } from '../../services/process.service';

export interface ProcessDetail {
  id: string;
  name: string;
  tempsParPF: number;
  cadenceMax: number;
}

@Component({
  selector: 'app-process-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="process-manager">
      <!-- Mode affichage -->
      <div *ngIf="!isEditing" class="process-display">
        <div *ngIf="processes.length === 0" class="empty-state">
          <span class="empty-text">Aucun process</span>
        </div>
        <div *ngIf="processes.length > 0" class="process-list">
          <div *ngFor="let process of processes" class="process-badge">
            <div class="process-name">{{ process.name }}</div>
            <div class="process-details">
              <span class="detail-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ process.tempsParPF }}s/PF
              </span>
              <span class="detail-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M2 12h20"/>
                </svg>
                {{ process.cadenceMax }} pcs/M/H
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode édition -->
      <div *ngIf="isEditing" class="process-editor">
        <!-- Liste des process ajoutés -->
        <div *ngIf="localProcesses().length > 0" class="added-processes">
          <div *ngFor="let process of localProcesses(); let i = index" class="process-item">
            <div class="process-header">
              <span class="process-title">{{ process.name }}</span>
              <button
                type="button"
                class="remove-btn"
                (click)="removeProcess(i)"
                title="Supprimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="process-inputs">
              <div class="input-group">
                <label>Temps (s/PF)</label>
                <input
                  type="number"
                  [(ngModel)]="process.tempsParPF"
                  [name]="'temps-' + i"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  class="process-input">
              </div>
              <div class="input-group">
                <label>Cadence max (pcs/M/H)</label>
                <input
                  type="number"
                  [(ngModel)]="process.cadenceMax"
                  [name]="'cadence-' + i"
                  min="0"
                  placeholder="0"
                  class="process-input">
              </div>
            </div>
          </div>
        </div>

        <!-- Sélecteur pour ajouter un process -->
        <div class="add-process-section">
          <select
            [(ngModel)]="selectedProcess"
            (change)="addProcess()"
            name="processSelector"
            class="process-select">
            <option value="">+ Ajouter un process</option>
            <option *ngFor="let proc of availableProcesses()" [value]="proc">
              {{ proc }}
            </option>
          </select>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .process-manager {
      min-height: 40px;
    }

    .process-display {
      min-height: 32px;
      display: flex;
      align-items: center;
    }

    .empty-state {
      width: 100%;
    }

    .empty-text {
      color: #999;
      font-style: italic;
      font-size: 0.85rem;
    }

    .process-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .process-badge {
      background: linear-gradient(135deg, #2196F3, #42A5F5);
      color: white;
      border-radius: 6px;
      padding: 0.5rem;
      font-size: 0.8rem;
    }

    .process-name {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .process-details {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      opacity: 0.95;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .detail-item svg {
      stroke-width: 2;
    }

    .process-editor {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .added-processes {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .process-item {
      background: #F5F5F5;
      border: 1.5px solid #E0E0E0;
      border-radius: 8px;
      padding: 0.75rem;
    }

    .process-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .process-title {
      font-weight: 600;
      color: #2196F3;
      font-size: 0.9rem;
    }

    .remove-btn {
      background: #F44336;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s ease;
    }

    .remove-btn:hover {
      background: #D32F2F;
    }

    .process-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .input-group label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #666;
    }

    .process-input {
      width: 100%;
      padding: 0.5rem;
      border: 1.5px solid #E0E0E0;
      border-radius: 6px;
      font-size: 0.85rem;
      transition: border-color 0.3s ease;
    }

    .process-input:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .add-process-section {
      margin-top: 0.5rem;
    }

    .process-select {
      width: 100%;
      padding: 0.6rem;
      border: 1.5px solid #E0E0E0;
      border-radius: 6px;
      font-size: 0.85rem;
      background: white;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }

    .process-select:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    @media (max-width: 768px) {
      .process-inputs {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProcessManagerComponent implements OnInit {
  @Input() processes: ProcessDetail[] = [];
  @Input() isEditing: boolean = false;
  @Output() processesChange = new EventEmitter<ProcessDetail[]>();

  selectedProcess = '';
  localProcesses = signal<ProcessDetail[]>([]);
  availableProcessList = signal<string[]>([]);

  constructor(private processService: ProcessService) {}

  ngOnInit() {
    this.localProcesses.set([...this.processes]);
    this.loadAvailableProcess();
  }

  ngOnChanges() {
    if (this.isEditing) {
      this.localProcesses.set([...this.processes]);
    }
  }

  loadAvailableProcess() {
    this.processService.getAllProcessSimple().subscribe({
      next: (process) => {
        const processNames = process
          .map(p => p.nom)
          .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
        this.availableProcessList.set(processNames);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des process:', error);
      }
    });
  }

  availableProcesses() {
    const usedProcesses = this.localProcesses().map(p => p.name);
    return this.availableProcessList().filter(p => !usedProcesses.includes(p));
  }

  addProcess() {
    if (this.selectedProcess) {
      const newProcess: ProcessDetail = {
        id: `process-${Date.now()}`,
        name: this.selectedProcess,
        tempsParPF: 0,
        cadenceMax: 0
      };

      const updated = [...this.localProcesses(), newProcess];
      this.localProcesses.set(updated);
      this.emitChanges(updated);
      this.selectedProcess = '';
    }
  }

  removeProcess(index: number) {
    const updated = this.localProcesses().filter((_, i) => i !== index);
    this.localProcesses.set(updated);
    this.emitChanges(updated);
  }

  private emitChanges(processes: ProcessDetail[]) {
    this.processesChange.emit(processes);
  }
}
