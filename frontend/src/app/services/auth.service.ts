// frontend/src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { TokenRefreshService } from './token-refresh.service';
import { environment } from '../../environments/environment';

export interface SignupRequest {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.BASE_URL}/api/auth`;
  private currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser: Observable<AuthResponse | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenRefreshService: TokenRefreshService
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<AuthResponse | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();

    // Si un utilisateur est déjà connecté, démarrer le rafraîchissement automatique
    if (storedUser) {
      console.log('👤 Utilisateur déjà connecté - Démarrage du rafraîchissement automatique');
      this.tokenRefreshService.startAutoRefresh();
      
      // Vérifier si le token actuel est proche de l'expiration
      this.tokenRefreshService.checkAndRefreshIfNeeded();
    }
  }

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  signup(signupData: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, signupData)
      .pipe(
        tap(response => {
          localStorage.setItem('currentUser', JSON.stringify(response));
          localStorage.setItem('token', response.token);
          this.currentUserSubject.next(response);
          
          // Démarrer le rafraîchissement automatique après inscription
          console.log('✅ Inscription réussie - Démarrage du rafraîchissement automatique');
          this.tokenRefreshService.startAutoRefresh();
        })
      );
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          localStorage.setItem('currentUser', JSON.stringify(response));
          localStorage.setItem('token', response.token);
          this.currentUserSubject.next(response);
          
          // Démarrer le rafraîchissement automatique après connexion
          console.log('✅ Connexion réussie - Démarrage du rafraîchissement automatique');
          this.tokenRefreshService.startAutoRefresh();
        })
      );
  }

  logout(): void {
    // Arrêter le rafraîchissement automatique
    console.log('👋 Déconnexion - Arrêt du rafraîchissement automatique');
    this.tokenRefreshService.stopAutoRefresh();
    
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue && !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Rafraîchit manuellement le token
   */
  refreshToken(): Observable<AuthResponse | null> {
    return this.tokenRefreshService.refreshToken();
  }
}