// frontend/src/app/components/articles-table/articles-table.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessManagerComponent, ProcessDetail } from '../process-manager/process-manager.component';
import { ClientsManagerComponent } from '../clients-manager/clients-manager.component';
import { ClientService } from '../../services/client.service';
import { ArticleService, ArticleResponse, CreateArticleRequest, UpdateArticleRequest } from '../../services/article.service';

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
  stock: number;
  imageFilename?: string; // ✅ NOUVEAU
  imagePreview?: string; // ✅ NOUVEAU: pour l'aperçu local
  imageFile?: File; // ✅ NOUVEAU: fichier en attente d'upload
  processes: ProcessDetail[];
  clients: string[];
  createdAt?: string;
  isEditing?: boolean;
  isNew?: boolean;
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
  searchTerm = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  private originalArticles: { [key: number]: Article } = {};
  private editingArticles: Set<number> = new Set();

  constructor(
    private clientService: ClientService,
    private articleService: ArticleService
  ) {}

  ngOnInit() {
    this.loadClients();
    this.loadArticles();
  }

  loadClients() {
    this.clientService.getAllClientsSimple().subscribe({
      next: (clients) => {
        const sortedClients = clients
          .map(c => c.nomComplet)
          .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

        this.availableClients.set(sortedClients);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients:', error);
        this.errorMessage.set('Erreur lors du chargement des clients');
      }
    });
  }

  loadArticles() {
    this.isLoading.set(true);
    this.articleService.getAllArticles().subscribe({
      next: (articles) => {
        const mapped: Article[] = articles.map(a => ({
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
          imageFilename: a.imageFilename, // ✅ NOUVEAU
          processes: a.processes || [],
          clients: a.clients || [],
          createdAt: a.createdAt,
          isEditing: false,
          isNew: false
        }));
        mapped.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        this.articles.set(mapped);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des articles:', error);
        this.errorMessage.set('Erreur lors du chargement des articles');
        this.isLoading.set(false);
      }
    });
  }

  filteredArticles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.articles();

    return this.articles().filter(article =>
      article.ref?.toLowerCase().includes(term) ||
      article.article?.toLowerCase().includes(term) ||
      article.famille?.toLowerCase().includes(term) ||
      article.sousFamille?.toLowerCase().includes(term) ||
      article.typeProcess?.toLowerCase().includes(term) ||
      article.typeProduit?.toLowerCase().includes(term) ||
      article.stock?.toString().includes(term) ||
      article.clients.some(c => c.toLowerCase().includes(term)) ||
      article.processes.some(p => p.name.toLowerCase().includes(term))
    );
  });

  // ✅ NOUVEAU: Gestion de l'upload d'image
  onImageSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Le fichier doit être une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('L\'image ne doit pas dépasser 5MB');
      return;
    }

    const article = this.filteredArticles()[index];
    const realIndex = this.articles().findIndex(a => a.id === article.id);

    // Créer un aperçu local
    const reader = new FileReader();
    reader.onload = (e) => {
      this.articles.update(articles => {
        const updated = [...articles];
        updated[realIndex].imagePreview = e.target?.result as string;
        updated[realIndex].imageFile = file;
        return updated;
      });
    };
    reader.readAsDataURL(file);
  }

  // ✅ NOUVEAU: Suppression d'image
  removeImage(index: number) {
    const article = this.filteredArticles()[index];
    const realIndex = this.articles().findIndex(a => a.id === article.id);

    this.articles.update(articles => {
      const updated = [...articles];
      updated[realIndex].imagePreview = undefined;
      updated[realIndex].imageFile = undefined;
      updated[realIndex].imageFilename = undefined;
      return updated;
    });
  }

  // ✅ NOUVEAU: Obtenir l'URL de l'image
  getImageUrl(filename: string): string {
    return this.articleService.getImageUrl(filename);
  }

  calculateTotalTime(processes: ProcessDetail[]): number {
    return processes.reduce((sum, p) => sum + (p.tempsParPF || 0), 0);
  }

  calculateBottleneck(processes: ProcessDetail[]): number | null {
    if (processes.length === 0) return null;
    const cadences = processes.map(p => p.cadenceMax).filter(c => c > 0);
    return cadences.length > 0 ? Math.min(...cadences) : null;
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
      isNew: true
    };

    this.articles.update(articles => [newArticle, ...articles]);
  }

  editRow(index: number) {
    const article = this.filteredArticles()[index];
    const realIndex = this.articles().findIndex(a => a.id === article.id);

    if (!article.isNew && article.id) {
      this.originalArticles[article.id] = JSON.parse(JSON.stringify(article));
      this.editingArticles.add(article.id);
    }

    this.articles.update(articles => {
      const updated = [...articles];
      updated[realIndex] = { ...updated[realIndex], isEditing: true };
      return updated;
    });
  }

  saveRow(index: number) {
  const article = this.filteredArticles()[index];
  const realIndex = this.articles().findIndex(a => a.id === article.id);

  if (!article.ref?.trim()) {
    this.errorMessage.set('La référence est obligatoire');
    return;
  }

  if (!article.article?.trim()) {
    this.errorMessage.set('Le nom de l\'article est obligatoire');
    return;
  }

  this.isLoading.set(true);
  this.errorMessage.set('');

  if (article.isNew) {
    // CRÉATION D'UN NOUVEL ARTICLE
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
      processes: article.processes || []
    };

    this.articleService.createArticle(request).subscribe({
      next: (response) => {
        console.log('✅ Article créé:', response);

        // Si une image a été sélectionnée, l'uploader
        if (article.imageFile) {
          console.log('📤 Upload de l\'image...');
          this.articleService.uploadImage(response.id, article.imageFile).subscribe({
            next: (updatedResponse) => {
              console.log('✅ Image uploadée avec succès:', updatedResponse);
              this.loadArticles();
              this.isLoading.set(false);
            },
            error: (err) => {
              console.error('❌ Erreur upload image:', err);
              this.errorMessage.set('Article créé mais erreur lors de l\'upload de l\'image');
              this.loadArticles();
              this.isLoading.set(false);
            }
          });
        } else {
          this.loadArticles();
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('❌ Erreur création article:', err);
        this.errorMessage.set(err.error?.message || 'Erreur lors de la création');
        this.isLoading.set(false);
      }
    });

  } else if (article.id) {
    // MISE À JOUR D'UN ARTICLE EXISTANT
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
      processes: article.processes || []
    };

    this.articleService.updateArticle(article.id, request).subscribe({
      next: (response) => {
        console.log('✅ Article mis à jour:', response);

        // Gérer l'image
        if (article.imageFile) {
          // Nouvelle image à uploader
          console.log('📤 Upload de la nouvelle image...');
          this.articleService.uploadImage(article.id!, article.imageFile).subscribe({
            next: () => {
              console.log('✅ Image uploadée');
              this.loadArticles();
              this.isLoading.set(false);
            },
            error: (err) => {
              console.error('❌ Erreur upload image:', err);
              this.loadArticles();
              this.isLoading.set(false);
            }
          });
        } else if (!article.imagePreview && !article.imageFilename) {
          // L'image a été supprimée
          console.log('🗑️ Suppression de l\'image...');
          this.articleService.deleteImage(article.id!).subscribe({
            next: () => {
              console.log('✅ Image supprimée');
              this.loadArticles();
              this.isLoading.set(false);
            },
            error: () => {
              this.loadArticles();
              this.isLoading.set(false);
            }
          });
        } else {
          // Pas de changement d'image
          this.loadArticles();
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('❌ Erreur mise à jour article:', err);
        this.errorMessage.set(err.error?.message || 'Erreur lors de la mise à jour');
        this.isLoading.set(false);
      }
    });
  }
}

  cancelEdit(index: number) {
    const article = this.filteredArticles()[index];
    const realIndex = this.articles().findIndex(a => a.id === article.id);

    if (article.isNew) {
      this.articles.update(articles => articles.filter((_, i) => i !== realIndex));
      return;
    }

    if (article.id) {
      const original = this.originalArticles[article.id];
      if (original) {
        this.articles.update(articles => {
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
    const article = this.filteredArticles()[index];
    const realIndex = this.articles().findIndex(a => a.id === article.id);

    if (article.isNew) {
      this.articles.update(articles => articles.filter((_, i) => i !== realIndex));
      return;
    }

    if (!article.id) return;

    if (!confirm(`Supprimer l'article "${article.article}" (Ref: ${article.ref}) ?`)) return;

    this.isLoading.set(true);
    this.articleService.deleteArticle(article.id).subscribe({
      next: () => {
        this.loadArticles();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erreur lors de la suppression');
        this.isLoading.set(false);
      }
    });
  }

  updateClients(articleIndex: number, clients: string[]) {
    const article = this.filteredArticles()[articleIndex];
    const realIndex = this.articles().findIndex(a => a.id === article.id);

    this.articles.update(articles => {
      const updated = [...articles];
      updated[realIndex].clients = clients;
      return updated;
    });
  }

  updateProcesses(articleIndex: number, processes: ProcessDetail[]) {
    const article = this.filteredArticles()[articleIndex];
    const realIndex = this.articles().findIndex(a => a.id === article.id);

    this.articles.update(articles => {
      const updated = [...articles];
      updated[realIndex].processes = processes;
      return updated;
    });
  }
}
