// frontend/src/app/services/commande.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateCommandeRequest {
  articleRef: string;
  numeroCommandeClient: string;  // NOUVEAU
  clientNom: string;
  quantite: number;
  typeCommande: string;   
  dateSouhaitee: string;
}

export interface UpdateCommandeRequest {
  articleRef: string;
  numeroCommandeClient: string;  // NOUVEAU
  clientNom: string;
  quantite: number;
  typeCommande: string;   
  dateSouhaitee: string;
}

export interface CommandeResponse {
  quantiteNonLivree: number;
  id: number;
  articleRef: string;
  articleNom: string;
  numeroCommandeClient: string;  // NOUVEAU
  clientNom: string;
  quantite: number;
  typeCommande: string;   
  dateSouhaitee: string;
  dateAjout: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommandeSummaryResponse {
  totalQuantite: number;
  quantiteFerme: number;          // NOUVEAU
  quantitePlanifiee: number;      // NOUVEAU
  nombreCommandes: number;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private apiUrl = 'http://localhost:8080/api/commandes';

  constructor(private http: HttpClient) {}

  createCommande(commande: CreateCommandeRequest): Observable<CommandeResponse> {
    return this.http.post<CommandeResponse>(this.apiUrl, commande);
  }

  getAllCommandes(): Observable<CommandeResponse[]> {
    return this.http.get<CommandeResponse[]>(this.apiUrl);
  }

  getCommandeById(id: number): Observable<CommandeResponse> {
    return this.http.get<CommandeResponse>(`${this.apiUrl}/${id}`);
  }

  searchByArticleRef(articleRef: string): Observable<CommandeResponse[]> {
    return this.http.get<CommandeResponse[]>(`${this.apiUrl}/search/article/${articleRef}`);
  }

  searchByClientNom(clientNom: string): Observable<CommandeResponse[]> {
    return this.http.get<CommandeResponse[]>(`${this.apiUrl}/search/client/${clientNom}`);
  }

  searchByDateSouhaitee(date: string): Observable<CommandeResponse[]> {
    return this.http.get<CommandeResponse[]>(`${this.apiUrl}/search/date-souhaitee/${date}`);
  }

  searchByDateAjout(date: string): Observable<CommandeResponse[]> {
    return this.http.get<CommandeResponse[]>(`${this.apiUrl}/search/date-ajout/${date}`);
  }

  searchByArticleRefAndDateSouhaitee(articleRef: string, date: string): Observable<CommandeResponse[]> {
    return this.http.get<CommandeResponse[]>(`${this.apiUrl}/search/article/${articleRef}/date-souhaitee/${date}`);
  }

  searchByArticleRefAndDateAjout(articleRef: string, date: string): Observable<CommandeResponse[]> {
    return this.http.get<CommandeResponse[]>(`${this.apiUrl}/search/article/${articleRef}/date-ajout/${date}`);
  }

  // ✅ NOUVEAU: Recherche par période
  searchByArticleRefAndPeriodeSouhaitee(articleRef: string, dateDebut: string, dateFin: string): Observable<CommandeResponse[]> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    return this.http.get<CommandeResponse[]>(`${this.apiUrl}/search/article/${articleRef}/periode-souhaitee`, { params });
  }

  searchByArticleRefAndPeriodeAjout(articleRef: string, dateDebut: string, dateFin: string): Observable<CommandeResponse[]> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    return this.http.get<CommandeResponse[]>(`${this.apiUrl}/search/article/${articleRef}/periode-ajout`, { params });
  }

  // Sommaires - uniquement pour article seul ou article + date/période
  getSummaryByArticleRef(articleRef: string): Observable<CommandeSummaryResponse> {
    return this.http.get<CommandeSummaryResponse>(`${this.apiUrl}/summary/article/${articleRef}`);
  }

  getSummaryByArticleRefAndDateSouhaitee(articleRef: string, date: string): Observable<CommandeSummaryResponse> {
    return this.http.get<CommandeSummaryResponse>(`${this.apiUrl}/summary/article/${articleRef}/date-souhaitee/${date}`);
  }

  getSummaryByArticleRefAndDateAjout(articleRef: string, date: string): Observable<CommandeSummaryResponse> {
    return this.http.get<CommandeSummaryResponse>(`${this.apiUrl}/summary/article/${articleRef}/date-ajout/${date}`);
  }

  // ✅ NOUVEAU: Sommaires pour les périodes
  getSummaryByArticleRefAndPeriodeSouhaitee(articleRef: string, dateDebut: string, dateFin: string): Observable<CommandeSummaryResponse> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    return this.http.get<CommandeSummaryResponse>(`${this.apiUrl}/summary/article/${articleRef}/periode-souhaitee`, { params });
  }

  getSummaryByArticleRefAndPeriodeAjout(articleRef: string, dateDebut: string, dateFin: string): Observable<CommandeSummaryResponse> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    return this.http.get<CommandeSummaryResponse>(`${this.apiUrl}/summary/article/${articleRef}/periode-ajout`, { params });
  }

  updateCommande(id: number, commande: UpdateCommandeRequest): Observable<CommandeResponse> {
    return this.http.put<CommandeResponse>(`${this.apiUrl}/${id}`, commande);
  }

  deleteCommande(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }

  // ✅ NOUVEAU: Export Excel
  exportToExcel(articleRef?: string, dateType?: string, date?: string, 
                dateDebut?: string, dateFin?: string): Observable<Blob> {
    let params = new HttpParams();
    
    if (articleRef) params = params.set('articleRef', articleRef);
    if (dateType) params = params.set('dateType', dateType);
    if (date) params = params.set('date', date);
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);
    
    return this.http.get(`${this.apiUrl}/export/excel`, {
      params: params,
      responseType: 'blob'
    });
  }
}