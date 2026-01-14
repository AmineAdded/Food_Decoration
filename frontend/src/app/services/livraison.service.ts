// frontend/src/app/services/livraison.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateLivraisonRequest {
  articleRef: string;
  clientNom: string;
  numeroCommandeClient: string;
  quantiteLivree: number;
  dateLivraison: string;
}

export interface UpdateLivraisonRequest {
  articleRef: string;
  clientNom: string;
  numeroCommandeClient: string;
  quantiteLivree: number;
  dateLivraison: string;
}

export interface LivraisonResponse {
  id: number;
  numeroBL: string;
  articleRef: string;
  articleNom: string;
  clientNom: string;
  numeroCommandeClient: string;
  quantiteLivree: number;
  dateLivraison: string;
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
export class LivraisonService {
  private apiUrl = `${environment.BASE_URL}/api/livraisons`;

  constructor(private http: HttpClient) {}

  createLivraison(livraison: CreateLivraisonRequest): Observable<LivraisonResponse> {
    return this.http.post<LivraisonResponse>(this.apiUrl, livraison);
  }

  getAllLivraisons(): Observable<LivraisonResponse[]> {
    return this.http.get<LivraisonResponse[]>(this.apiUrl);
  }

  getLivraisonById(id: number): Observable<LivraisonResponse> {
    return this.http.get<LivraisonResponse>(`${this.apiUrl}/${id}`);
  }

  searchByArticleRef(articleRef: string): Observable<LivraisonResponse[]> {
    return this.http.get<LivraisonResponse[]>(`${this.apiUrl}/search/article/${articleRef}`);
  }

  searchByClientNom(clientNom: string): Observable<LivraisonResponse[]> {
    return this.http.get<LivraisonResponse[]>(`${this.apiUrl}/search/client/${clientNom}`);
  }

  searchByNumeroCommande(numeroCommande: string): Observable<LivraisonResponse[]> {
    return this.http.get<LivraisonResponse[]>(`${this.apiUrl}/search/commande/${numeroCommande}`);
  }

  updateLivraison(id: number, livraison: UpdateLivraisonRequest): Observable<LivraisonResponse> {
    return this.http.put<LivraisonResponse>(`${this.apiUrl}/${id}`, livraison);
  }

  deleteLivraison(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }

  // ✅ NOUVEAU: Export Excel
  exportToExcel(articleRef?: string, clientNom?: string, numeroCommande?: string): Observable<Blob> {
    let params = new HttpParams();
    
    if (articleRef) params = params.set('articleRef', articleRef);
    if (clientNom) params = params.set('clientNom', clientNom);
    if (numeroCommande) params = params.set('numeroCommande', numeroCommande);
    
    return this.http.get(`${this.apiUrl}/export/excel`, {
      params: params,
      responseType: 'blob'
    });
  }
}