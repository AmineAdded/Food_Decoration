// frontend/src/app/components/articles-table/articles-table.component.ts (MIS À JOUR)
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessManagerComponent, ProcessDetail } from '../process-manager/process-manager.component';
import { ClientsManagerComponent } from '../clients-manager/clients-manager.component';
import { ClientService } from '../../services/client.service';

interface Article {
  id?: number;
  ref: string;
  article: string;
  famille: string;
  sousFamille: string;
  typeProcess: string;
  typeProduit: string;
  prixUnitaire: number;
  mpq: number;
  processes: ProcessDetail[];
  clients: string[];
  isEditing?: boolean;
}

@Component({
  selector: 'app-articles-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ProcessManagerComponent, ClientsManagerComponent],
  templateUrl: './articles-table.component.html',
  styleUrl: './articles-table.component.css'
})
export class ArticlesTableComponent implements OnInit {
  articles = signal<Article[]>([]);
  availableClients = signal<string[]>([]);
  searchTerm = '';

  private originalArticles: { [key: number]: Article } = {};

  constructor(private clientService: ClientService) {}

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.clientService.getAllClientsSimple().subscribe({
      next: (clients) => {
        // Tri alphabétique des clients
        const sortedClients = clients
          .map(c => c.nomComplet)
          .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
        
        this.availableClients.set(sortedClients);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients:', error);
      }
    });
  }

  filteredArticles = computed(() => {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.articles();

    return this.articles().filter(article =>
      article.ref?.toLowerCase().includes(term) ||
      article.article?.toLowerCase().includes(term) ||
      article.famille?.toLowerCase().includes(term) ||
      article.sousFamille?.toLowerCase().includes(term) ||
      article.typeProcess?.toLowerCase().includes(term) ||
      article.typeProduit?.toLowerCase().includes(term) ||
      article.clients.some(c => c.toLowerCase().includes(term))
    );
  });

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
      processes: [],
      clients: [],
      isEditing: true
    };

    this.articles.update(articles => [newArticle, ...articles]);
  }

  editRow(index: number) {
    const currentArticles = this.articles();
    this.originalArticles[index] = JSON.parse(JSON.stringify(currentArticles[index]));

    this.articles.update(articles => {
      const updated = [...articles];
      updated[index] = { ...updated[index], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
    this.articles.update(articles => {
      const updated = [...articles];
      updated[index] = { ...updated[index], isEditing: false };
      return updated;
    });

    delete this.originalArticles[index];
    console.log('Article sauvegardé:', this.articles()[index]);
  }

  cancelEdit(index: number) {
    if (this.originalArticles[index]) {
      this.articles.update(articles => {
        const updated = [...articles];
        updated[index] = { ...this.originalArticles[index], isEditing: false };
        return updated;
      });
      delete this.originalArticles[index];
    } else {
      this.articles.update(articles => articles.filter((_, i) => i !== index));
    }
  }

  deleteRow(index: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      this.articles.update(articles => articles.filter((_, i) => i !== index));
      delete this.originalArticles[index];
    }
  }

  updateClients(articleIndex: number, clients: string[]) {
    this.articles.update(articles => {
      const updated = [...articles];
      updated[articleIndex].clients = clients;
      return updated;
    });
  }

  updateProcesses(articleIndex: number, processes: ProcessDetail[]) {
    this.articles.update(articles => {
      const updated = [...articles];
      updated[articleIndex].processes = processes;
      return updated;
    });
  }
}