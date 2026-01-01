// frontend/src/app/components/clients-manager/clients-manager.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clients-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="clients-manager">
      <!-- Mode affichage avec scroll horizontal -->
      <div *ngIf="!isEditing" class="clients-display">
        <div class="clients-scroll-wrapper">
          <span class="client-badge" *ngFor="let client of clients">
            {{ client }}
          </span>
          <span *ngIf="clients.length === 0" class="empty-text">-</span>
        </div>
      </div>

      <!-- Mode édition -->
      <div *ngIf="isEditing" class="clients-editor">
        <select
          [(ngModel)]="selectedClient"
          (change)="onAddClient()"
          name="clientSelector"
          class="client-select">
          <option value="">Ajouter un client</option>
          <option *ngFor="let client of availableClientsList" [value]="client">
            {{ client }}
          </option>
        </select>

        <div *ngIf="clients.length > 0" class="clients-list-edit">
          <span class="client-badge editable" *ngFor="let client of clients; let i = index">
            {{ client }}
            <button
              type="button"
              class="remove-client"
              (click)="onRemoveClient(i)"
              title="Retirer">
              ×
            </button>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clients-manager {
      width: 100%;
      min-height: 32px;
    }

    .clients-display {
      width: 100%;
      min-height: 32px;
      display: flex;
      align-items: center;
    }

    /* Wrapper avec scroll horizontal pour l'affichage */
    .clients-scroll-wrapper {
      display: flex;
      flex-wrap: nowrap; /* Pas de retour à la ligne */
      gap: 0.35rem;
      align-items: center;
      overflow-x: auto;
      overflow-y: hidden;
      max-width: 100%;
      padding: 2px 0; /* Évite que les badges soient coupés */
      scrollbar-width: thin;
      scrollbar-color: #9C27B0 #f1f1f1;
    }

    /* Scrollbar personnalisée pour webkit */
    .clients-scroll-wrapper::-webkit-scrollbar {
      height: 6px;
    }

    .clients-scroll-wrapper::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .clients-scroll-wrapper::-webkit-scrollbar-thumb {
      background: #9C27B0;
      border-radius: 3px;
    }

    .clients-scroll-wrapper::-webkit-scrollbar-thumb:hover {
      background: #7B1FA2;
    }

    .clients-editor {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .client-select {
      width: 100%;
      padding: 0.5rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      background: white;
    }

    .client-select:focus {
      outline: none;
      border-color: #9C27B0;
      box-shadow: 0 0 0 3px rgba(156, 39, 176, 0.1);
    }

    /* Liste en mode édition avec wrap */
    .clients-list-edit {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      max-height: 120px; /* Limite la hauteur en édition */
      overflow-y: auto;
      padding: 0.25rem 0;
    }

    .clients-list-edit::-webkit-scrollbar {
      width: 6px;
    }

    .clients-list-edit::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .clients-list-edit::-webkit-scrollbar-thumb {
      background: #9C27B0;
      border-radius: 3px;
    }

    .client-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.6rem;
      background: linear-gradient(135deg, #9C27B0, #BA68C8);
      color: white;
      border-radius: 5px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap; /* Empêche le texte de se couper */
      flex-shrink: 0; /* Empêche les badges de rétrécir */
      line-height: 1.2;
    }

    .client-badge.editable {
      padding-right: 0.3rem;
    }

    .remove-client {
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0 0.25rem;
      line-height: 1;
      opacity: 0.8;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .remove-client:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    .empty-text {
      color: #999;
      font-style: italic;
      font-size: 0.85rem;
      padding: 0.3rem;
    }
  `]
})
export class ClientsManagerComponent {
  @Input() clients: string[] = [];
  @Input() isEditing: boolean = false;
  @Input() availableClientsList: string[] = [];
  @Output() clientsChange = new EventEmitter<string[]>();

  selectedClient = '';

  onAddClient() {
    if (this.selectedClient && !this.clients.includes(this.selectedClient)) {
      const updated = [...this.clients, this.selectedClient];
      this.clientsChange.emit(updated);
      this.selectedClient = '';
    }
  }

  onRemoveClient(index: number) {
    const updated = this.clients.filter((_, i) => i !== index);
    this.clientsChange.emit(updated);
  }
}