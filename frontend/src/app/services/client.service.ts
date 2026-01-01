// frontend/src/app/services/client.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateClientRequest {
  ref: string | null;
  nomComplet: string;
  adresseLivraison?: string;
  adresseFacturation?: string;
  devise?: string;
  modeTransport?: string;
  incoTerme?: string;
}

export interface UpdateClientRequest {
  ref: string | null;
  nomComplet: string;
  adresseLivraison?: string;
  adresseFacturation?: string;
  devise?: string;
  modeTransport?: string;
  incoTerme?: string;
}

export interface ClientResponse {
  id: number;
  ref: string | null;
  nomComplet: string;
  adresseLivraison?: string;
  adresseFacturation?: string;
  devise?: string;
  modeTransport?: string;
  incoTerme?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientSimpleResponse {
  id: number;
  nomComplet: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = 'http://localhost:8080/api/clients';

  constructor(private http: HttpClient) {}

  createClient(client: CreateClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.apiUrl, client);
  }

  getAllClients(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(this.apiUrl);
  }

  getAllClientsSimple(): Observable<ClientSimpleResponse[]> {
    return this.http.get<ClientSimpleResponse[]>(`${this.apiUrl}/simple`);
  }

  getClientById(id: number): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${this.apiUrl}/${id}`);
  }

  updateClient(id: number, client: UpdateClientRequest): Observable<ClientResponse> {
    return this.http.put<ClientResponse>(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
