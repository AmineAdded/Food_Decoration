// frontend/src/app/services/article.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProcessDetail {
  id: string;
  name: string;
  tempsParPF: number;
  cadenceMax: number;
}

export interface CreateArticleRequest {
  ref: string;
  article: string;
  famille: string;
  sousFamille: string;
  typeProcess: string;
  typeProduit: string;
  prixUnitaire: number;
  mpq: number;
  stock: number;
  clients: string[];
  processes: ProcessDetail[];
}

export interface UpdateArticleRequest {
  ref: string;
  article: string;
  famille: string;
  sousFamille: string;
  typeProcess: string;
  typeProduit: string;
  prixUnitaire: number;
  mpq: number;
  stock: number;
  clients: string[];
  processes: ProcessDetail[];
}

export interface ArticleResponse {
  id: number;
  ref: string;
  article: string;
  famille: string;
  sousFamille: string;
  typeProcess: string;
  typeProduit: string;
  prixUnitaire: number;
  mpq: number;
  stock: number;
  imageUrl?: string;
  clients: string[];
  processes: ProcessDetail[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = `${environment.BASE_URL}/api/articles`;

  constructor(private http: HttpClient) {}

  createArticle(article: CreateArticleRequest): Observable<ArticleResponse> {
    return this.http.post<ArticleResponse>(this.apiUrl, article);
  }

  getAllArticles(): Observable<ArticleResponse[]> {
    return this.http.get<ArticleResponse[]>(this.apiUrl);
  }

  getArticleById(id: number): Observable<ArticleResponse> {
    return this.http.get<ArticleResponse>(`${this.apiUrl}/${id}`);
  }

  updateArticle(id: number, article: UpdateArticleRequest): Observable<ArticleResponse> {
    return this.http.put<ArticleResponse>(`${this.apiUrl}/${id}`, article);
  }

  deleteArticle(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }

  uploadImage(articleId: number, file: File): Observable<ArticleResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ArticleResponse>(`${this.apiUrl}/${articleId}/image`, formData);
  }

  getImageUrl(filename: string): string {
    return `${this.apiUrl}/image/${filename}`;
  }

  deleteImage(articleId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${articleId}/image`);
  }

  // ✅ NOUVEAU: Listes déroulantes
  getDistinctRefs(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/distinct-refs`);
  }

  getDistinctNoms(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/distinct-noms`);
  }

  getDistinctFamilles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/distinct-familles`);
  }

  getDistinctTypeProduits(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/distinct-type-produits`);
  }

  getDistinctTypeProcess(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/distinct-type-process`);
  }

  // Recherche
  searchByRef(ref: string): Observable<ArticleResponse[]> {
    return this.http.get<ArticleResponse[]>(`${this.apiUrl}/search/ref/${ref}`);
  }

  searchByNom(nom: string): Observable<ArticleResponse[]> {
    return this.http.get<ArticleResponse[]>(`${this.apiUrl}/search/nom/${nom}`);
  }

  searchByFamille(famille: string): Observable<ArticleResponse[]> {
    return this.http.get<ArticleResponse[]>(`${this.apiUrl}/search/famille/${famille}`);
  }

  searchByTypeProduit(typeProduit: string): Observable<ArticleResponse[]> {
    return this.http.get<ArticleResponse[]>(`${this.apiUrl}/search/type-produit/${typeProduit}`);
  }

  searchByTypeProcess(typeProcess: string): Observable<ArticleResponse[]> {
    return this.http.get<ArticleResponse[]>(`${this.apiUrl}/search/type-process/${typeProcess}`);
  }
}