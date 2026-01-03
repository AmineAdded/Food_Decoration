// frontend/src/app/services/production.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateProductionRequest {
  articleRef: string;
  quantite: number;
  dateProduction: string; // Format: YYYY-MM-DD
}

export interface UpdateProductionRequest {
  articleRef: string;
  quantite: number;
  dateProduction: string;
}

export interface ProductionResponse {
  id: number;
  articleRef: string;
  articleNom: string;
  quantite: number;
  dateProduction: string;
  stockActuel: number;
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
export class ProductionService {
  private apiUrl = 'http://localhost:8080/api/production';

  constructor(private http: HttpClient) {}

  createProduction(production: CreateProductionRequest): Observable<ProductionResponse> {
    return this.http.post<ProductionResponse>(this.apiUrl, production);
  }

  getAllProductions(): Observable<ProductionResponse[]> {
    return this.http.get<ProductionResponse[]>(this.apiUrl);
  }

  getProductionById(id: number): Observable<ProductionResponse> {
    return this.http.get<ProductionResponse>(`${this.apiUrl}/${id}`);
  }

  searchByArticleRef(articleRef: string): Observable<ProductionResponse[]> {
    return this.http.get<ProductionResponse[]>(`${this.apiUrl}/search/article/${articleRef}`);
  }

  searchByDate(date: string): Observable<ProductionResponse[]> {
    return this.http.get<ProductionResponse[]>(`${this.apiUrl}/search/date/${date}`);
  }

  searchByArticleRefAndDate(articleRef: string, date: string): Observable<ProductionResponse[]> {
    return this.http.get<ProductionResponse[]>(`${this.apiUrl}/search/article/${articleRef}/date/${date}`);
  }

  searchByYearAndMonth(year: number, month: number): Observable<ProductionResponse[]> {
    return this.http.get<ProductionResponse[]>(`${this.apiUrl}/search/year/${year}/month/${month}`);
  }

  searchByArticleRefAndYearAndMonth(articleRef: string, year: number, month: number): Observable<ProductionResponse[]> {
    return this.http.get<ProductionResponse[]>(`${this.apiUrl}/search/article/${articleRef}/year/${year}/month/${month}`);
  }

  updateProduction(id: number, production: UpdateProductionRequest): Observable<ProductionResponse> {
    return this.http.put<ProductionResponse>(`${this.apiUrl}/${id}`, production);
  }

  deleteProduction(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }

  exportToExcel(articleRef?: string, date?: string): Observable<Blob> {
    let params = '';
    if (articleRef) params += `?articleRef=${articleRef}`;
    if (date) params += (params ? '&' : '?') + `date=${date}`;
    
    return this.http.get(`${this.apiUrl}/export/excel${params}`, {
      responseType: 'blob'
    });
  }
}