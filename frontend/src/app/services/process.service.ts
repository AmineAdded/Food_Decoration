// frontend/src/app/services/process.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateProcessRequest {
  ref: string | null;
  nom: string;
}

export interface UpdateProcessRequest {
  ref: string | null;
  nom: string;
}

export interface ProcessResponse {
  id: number;
  ref: string | null;
  nom: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessSimpleResponse {
  id: number;
  nom: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProcessService {
  private apiUrl = 'http://localhost:8080/api/process';

  constructor(private http: HttpClient) {}

  createProcess(process: CreateProcessRequest): Observable<ProcessResponse> {
    return this.http.post<ProcessResponse>(this.apiUrl, process);
  }

  getAllProcess(): Observable<ProcessResponse[]> {
    return this.http.get<ProcessResponse[]>(this.apiUrl);
  }

  getAllProcessSimple(): Observable<ProcessSimpleResponse[]> {
    return this.http.get<ProcessSimpleResponse[]>(`${this.apiUrl}/simple`);
  }

  getProcessById(id: number): Observable<ProcessResponse> {
    return this.http.get<ProcessResponse>(`${this.apiUrl}/${id}`);
  }

  updateProcess(id: number, process: UpdateProcessRequest): Observable<ProcessResponse> {
    return this.http.put<ProcessResponse>(`${this.apiUrl}/${id}`, process);
  }

  deleteProcess(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }
}
